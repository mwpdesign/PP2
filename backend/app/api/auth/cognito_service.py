"""
AWS Cognito service wrapper for handling authentication and user management.
Implements HIPAA-compliant authentication flows with MFA support.
"""
from typing import Dict
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
import os
import hmac
import base64
import hashlib


class CognitoService:
    def __init__(self):
        self.client = boto3.client('cognito-idp')
        self.user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
        self.client_id = os.getenv('COGNITO_CLIENT_ID')
        self.client_secret = os.getenv('COGNITO_CLIENT_SECRET')

        if not all([self.user_pool_id, self.client_id, self.client_secret]):
            raise ValueError("Missing required Cognito configuration")

    async def register_user(
        self, email: str, password: str, attributes: Dict[str, str]
    ) -> Dict:
        """Register a new user with Cognito."""
        try:
            response = self.client.sign_up(
                ClientId=self.client_id,
                SecretHash=self._compute_secret_hash(email),
                Username=email,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    *[{'Name': k, 'Value': v} for k, v in attributes.items()]
                ]
            )
            return {
                'user_id': response['UserSub'],
                'email': email,
                'status': 'CONFIRMATION_PENDING'
            }
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    async def confirm_registration(
        self, email: str, confirmation_code: str
    ) -> Dict:
        """Confirm user registration with verification code."""
        try:
            self.client.confirm_sign_up(
                ClientId=self.client_id,
                SecretHash=self._compute_secret_hash(email),
                Username=email,
                ConfirmationCode=confirmation_code
            )
            return {'message': 'User confirmed successfully'}
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    async def initiate_auth(self, email: str, password: str) -> Dict:
        """Initiate authentication and handle MFA if required."""
        try:
            auth_response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password,
                    'SECRET_HASH': self._compute_secret_hash(email)
                }
            )

            challenge_name = auth_response.get('ChallengeName')

            if challenge_name in ('SMS_MFA', 'SOFTWARE_TOKEN_MFA'):
                return {
                    'status': 'MFA_REQUIRED',
                    'session': auth_response['Session'],
                    'challenge_name': challenge_name
                }

            return self._process_auth_tokens(
                auth_response['AuthenticationResult']
            )

        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )

    async def verify_mfa(
        self,
        email: str,
        session: str,
        mfa_code: str,
        challenge_name: str
    ) -> Dict:
        """Verify MFA code and complete authentication."""
        try:
            auth_response = self.client.respond_to_auth_challenge(
                ClientId=self.client_id,
                ChallengeName=challenge_name,
                Session=session,
                ChallengeResponses={
                    'USERNAME': email,
                    'SMS_MFA_CODE': mfa_code,
                    'SECRET_HASH': self._compute_secret_hash(email)
                }
            )

            return self._process_auth_tokens(
                auth_response['AuthenticationResult']
            )

        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )

    async def refresh_token(self, refresh_token: str) -> Dict:
        """Refresh the access token using a valid refresh token."""
        try:
            auth_params = {
                'REFRESH_TOKEN': refresh_token,
                'SECRET_HASH': self._compute_secret_hash(refresh_token)
            }
            auth_response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters=auth_params
            )

            return self._process_auth_tokens(
                auth_response['AuthenticationResult']
            )

        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )

    async def setup_totp(self, access_token: str) -> Dict:
        """Set up TOTP MFA for a user."""
        try:
            response = self.client.associate_software_token(
                AccessToken=access_token
            )
            return {
                'secret_code': response['SecretCode']
            }
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    async def verify_totp_setup(self, access_token: str, totp_code: str) -> Dict:
        """Verify TOTP setup with the first code."""
        try:
            self.client.verify_software_token(
                AccessToken=access_token,
                UserCode=totp_code
            )
            return {'message': 'TOTP MFA setup completed'}
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    async def initiate_password_reset(self, email: str) -> Dict:
        """Initiate the password reset process."""
        try:
            self.client.forgot_password(
                ClientId=self.client_id,
                SecretHash=self._compute_secret_hash(email),
                Username=email
            )
            return {'message': 'Password reset initiated'}
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    async def complete_password_reset(
        self,
        email: str,
        confirmation_code: str,
        new_password: str
    ) -> Dict:
        """Complete the password reset process."""
        try:
            self.client.confirm_forgot_password(
                ClientId=self.client_id,
                SecretHash=self._compute_secret_hash(email),
                Username=email,
                ConfirmationCode=confirmation_code,
                Password=new_password
            )
            return {'message': 'Password reset completed'}
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    def _compute_secret_hash(self, username: str) -> str:
        """Compute the secret hash for Cognito API calls."""
        message = username + self.client_id
        key = self.client_secret.encode('utf-8')
        msg = message.encode('utf-8')
        hasher = hmac.new(
            key=key,
            msg=msg,
            digestmod=hashlib.sha256
        )
        dig = hasher.digest()
        return base64.b64encode(dig).decode()

    def _process_auth_tokens(self, auth_result: Dict) -> Dict:
        """Process and validate authentication tokens."""
        return {
            'access_token': auth_result['AccessToken'],
            'id_token': auth_result['IdToken'],
            'refresh_token': auth_result.get('RefreshToken'),
            'expires_in': auth_result['ExpiresIn'],
            'token_type': auth_result['TokenType']
        }
