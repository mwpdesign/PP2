"""AWS Cognito service for user authentication."""

import boto3
from botocore.exceptions import ClientError
from typing import Dict, Optional

from app.core.config import settings


class CognitoService:
    """AWS Cognito service for user authentication."""

    def __init__(self):
        """Initialize Cognito client."""
        self.client = boto3.client(
            "cognito-idp",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_ENDPOINT_URL,
        )
        self.user_pool_id = settings.AWS_COGNITO_USER_POOL_ID
        self.client_id = settings.AWS_COGNITO_CLIENT_ID

    def sign_up(
        self, email: str, password: str, user_attributes: Optional[Dict] = None
    ) -> Dict:
        """Sign up a new user."""
        try:
            attributes = [
                {"Name": "email", "Value": email},
                {"Name": "email_verified", "Value": "true"},
            ]
            if user_attributes:
                for key, value in user_attributes.items():
                    attributes.append({"Name": key, "Value": str(value)})

            response = self.client.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=attributes,
            )

            # Auto confirm user for development
            if settings.ENVIRONMENT == "development":
                self.client.admin_confirm_sign_up(
                    UserPoolId=self.user_pool_id, Username=email
                )

            return response
        except ClientError as e:
            raise Exception(f"Failed to register user: {str(e)}")

    def confirm_sign_up(self, email: str, code: str) -> Dict:
        """Confirm user sign up with verification code."""
        try:
            response = self.client.confirm_sign_up(
                ClientId=self.client_id, Username=email, ConfirmationCode=code
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to confirm sign up: {str(e)}")

    def initiate_auth(self, email: str, password: str) -> Dict:
        """Initiate authentication flow."""
        try:
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={"USERNAME": email, "PASSWORD": password},
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to authenticate user: {str(e)}")

    def get_user(self, access_token: str) -> Dict:
        """Get user information using access token."""
        try:
            response = self.client.get_user(AccessToken=access_token)
            return response
        except ClientError as e:
            raise Exception(f"Failed to get user information: {str(e)}")

    async def sign_out(self, access_token: str) -> Dict:
        """Sign out a user from Cognito"""
        try:
            response = self.client.global_sign_out(AccessToken=access_token)
            return response

        except ClientError as e:
            raise Exception(f"Failed to sign out user: {str(e)}")

    async def delete_user(self, username: str) -> None:
        """Delete a user from Cognito"""
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id, Username=username
            )

        except ClientError as e:
            raise Exception(f"Failed to delete user: {str(e)}")

    async def update_user_attributes(self, access_token: str, attributes: Dict) -> Dict:
        """Update user attributes in Cognito"""
        try:
            user_attributes = [
                {"Name": key, "Value": str(value)} for key, value in attributes.items()
            ]

            response = self.client.update_user_attributes(
                AccessToken=access_token, UserAttributes=user_attributes
            )
            return response

        except ClientError as e:
            raise Exception(f"Failed to update user attributes: {str(e)}")
