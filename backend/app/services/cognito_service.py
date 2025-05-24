from typing import Dict, Optional
from botocore.exceptions import ClientError
from ..core.cognito_config import cognito

class CognitoError(Exception):
    """Base exception for Cognito-related errors."""
    pass

class CognitoService:
    """Service for handling AWS Cognito authentication operations."""
    
    def __init__(self):
        self.cognito = cognito
    
    async def user_registration(
        self,
        email: str,
        password: str,
        user_attributes: Optional[Dict[str, str]] = None
    ) -> Dict:
        """Register a new user in Cognito.
        
        Args:
            email: User's email address
            password: User's password
            user_attributes: Additional user attributes
            
        Returns:
            Dict containing registration response
            
        Raises:
            CognitoError: If registration fails
        """
        try:
            client = await self.cognito.get_client()
            
            attributes = [
                {"Name": "email", "Value": email},
                {"Name": "email_verified", "Value": "true"}
            ]
            
            if user_attributes:
                for key, value in user_attributes.items():
                    attributes.append({"Name": key, "Value": str(value)})
            
            response = client.sign_up(
                ClientId=self.cognito.settings.COGNITO_APP_CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=attributes
            )
            
            return {
                "user_id": response["UserSub"],
                "email": email,
                "status": "CONFIRMATION_PENDING"
            }
            
        except ClientError as e:
            error = e.response["Error"]
            raise CognitoError(f"Registration failed: {error['Message']}")
    
    async def user_login(self, email: str, password: str) -> Dict:
        """Authenticate user and get tokens.
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            Dict containing access and refresh tokens
            
        Raises:
            CognitoError: If authentication fails
        """
        try:
            client = await self.cognito.get_client()
            
            response = client.initiate_auth(
                ClientId=self.cognito.settings.COGNITO_APP_CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": email,
                    "PASSWORD": password
                }
            )
            
            return {
                "access_token": response["AuthenticationResult"]["AccessToken"],
                "refresh_token": response["AuthenticationResult"]["RefreshToken"],
                "id_token": response["AuthenticationResult"]["IdToken"],
                "expires_in": response["AuthenticationResult"]["ExpiresIn"]
            }
            
        except ClientError as e:
            error = e.response["Error"]
            raise CognitoError(f"Login failed: {error['Message']}")
    
    async def verify_token(self, token: str) -> Dict:
        """Verify and decode an access token.
        
        Args:
            token: JWT access token
            
        Returns:
            Dict containing decoded token claims
            
        Raises:
            CognitoError: If token is invalid
        """
        try:
            client = await self.cognito.get_client()
            
            response = client.get_user(
                AccessToken=token
            )
            
            return {
                "username": response["Username"],
                "attributes": {
                    attr["Name"]: attr["Value"] 
                    for attr in response["UserAttributes"]
                }
            }
            
        except ClientError as e:
            error = e.response["Error"]
            raise CognitoError(f"Token verification failed: {error['Message']}")
    
    async def refresh_access_token(self, refresh_token: str) -> Dict:
        """Get new access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Dict containing new access token
            
        Raises:
            CognitoError: If refresh fails
        """
        try:
            client = await self.cognito.get_client()
            
            response = client.initiate_auth(
                ClientId=self.cognito.settings.COGNITO_APP_CLIENT_ID,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={
                    "REFRESH_TOKEN": refresh_token
                }
            )
            
            return {
                "access_token": response["AuthenticationResult"]["AccessToken"],
                "id_token": response["AuthenticationResult"]["IdToken"],
                "expires_in": response["AuthenticationResult"]["ExpiresIn"]
            }
            
        except ClientError as e:
            error = e.response["Error"]
            raise CognitoError(f"Token refresh failed: {error['Message']}")
    
    async def initiate_password_reset(self, email: str) -> Dict:
        """Initiate password reset process.
        
        Args:
            email: User's email
            
        Returns:
            Dict containing confirmation details
            
        Raises:
            CognitoError: If request fails
        """
        try:
            client = await self.cognito.get_client()
            
            response = client.forgot_password(
                ClientId=self.cognito.settings.COGNITO_APP_CLIENT_ID,
                Username=email
            )
            
            return {
                "email": email,
                "delivery_details": response.get("CodeDeliveryDetails", {})
            }
            
        except ClientError as e:
            error = e.response["Error"]
            raise CognitoError(f"Password reset initiation failed: {error['Message']}")
    
    async def confirm_password_reset(
        self,
        email: str,
        confirmation_code: str,
        new_password: str
    ) -> Dict:
        """Complete password reset process.
        
        Args:
            email: User's email
            confirmation_code: Reset confirmation code
            new_password: New password
            
        Returns:
            Dict containing confirmation status
            
        Raises:
            CognitoError: If confirmation fails
        """
        try:
            client = await self.cognito.get_client()
            
            response = client.confirm_forgot_password(
                ClientId=self.cognito.settings.COGNITO_APP_CLIENT_ID,
                Username=email,
                ConfirmationCode=confirmation_code,
                Password=new_password
            )
            
            return {
                "email": email,
                "status": "PASSWORD_RESET_COMPLETE"
            }
            
        except ClientError as e:
            error = e.response["Error"]
            raise CognitoError(f"Password reset confirmation failed: {error['Message']}")

# Global instance
cognito_service = CognitoService() 