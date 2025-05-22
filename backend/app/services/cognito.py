import boto3
from botocore.exceptions import ClientError
from typing import Dict, Optional

from app.core.config import settings


class CognitoService:
    def __init__(self):
        self.client = boto3.client(
            'cognito-idp',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_DEFAULT_REGION
        )
        self.user_pool_id = settings.AWS_COGNITO_USER_POOL_ID
        self.client_id = settings.AWS_COGNITO_CLIENT_ID

    async def sign_up(
        self,
        email: str,
        password: str,
        user_attributes: Optional[Dict] = None
    ) -> Dict:
        """Register a new user in Cognito"""
        try:
            attributes = [
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
            ]

            if user_attributes:
                for key, value in user_attributes.items():
                    attributes.append({'Name': key, 'Value': str(value)})

            response = self.client.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=attributes
            )
            
            # Auto confirm user for development
            if settings.ENVIRONMENT == "development":
                self.client.admin_confirm_sign_up(
                    UserPoolId=self.user_pool_id,
                    Username=email
                )

            return response

        except ClientError as e:
            raise Exception(f"Failed to register user: {str(e)}")

    async def sign_in(self, username: str, password: str) -> Dict:
        """Authenticate a user with Cognito"""
        try:
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
            return response

        except ClientError as e:
            raise Exception(f"Failed to authenticate user: {str(e)}")

    async def sign_out(self, access_token: str) -> Dict:
        """Sign out a user from Cognito"""
        try:
            response = self.client.global_sign_out(
                AccessToken=access_token
            )
            return response

        except ClientError as e:
            raise Exception(f"Failed to sign out user: {str(e)}")

    async def delete_user(self, username: str) -> None:
        """Delete a user from Cognito"""
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id,
                Username=username
            )

        except ClientError as e:
            raise Exception(f"Failed to delete user: {str(e)}")

    async def update_user_attributes(
        self,
        access_token: str,
        attributes: Dict
    ) -> Dict:
        """Update user attributes in Cognito"""
        try:
            user_attributes = [
                {'Name': key, 'Value': str(value)}
                for key, value in attributes.items()
            ]

            response = self.client.update_user_attributes(
                AccessToken=access_token,
                UserAttributes=user_attributes
            )
            return response

        except ClientError as e:
            raise Exception(f"Failed to update user attributes: {str(e)}") 