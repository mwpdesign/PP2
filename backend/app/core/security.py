"""
Security utilities for token validation and HIPAA compliance.
"""
from typing import Optional, Dict
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

security = HTTPBearer()

class SecurityService:
    def __init__(self):
        self.jwt_secret = os.getenv('JWT_SECRET_KEY')
        self.algorithm = 'HS256'
        self.access_token_expire = 3600  # 1 hour
        self.refresh_token_expire = 604800  # 7 days
        self.phi_session_timeout = 1800  # 30 minutes
        self.device_trust_expire = 2592000  # 30 days
        
        if not self.jwt_secret:
            raise ValueError("JWT_SECRET_KEY environment variable is required")

    def decode_token(self, token: str) -> Dict:
        """Decode and validate JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.algorithm]
            )
            
            if self._is_token_expired(payload):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired"
                )
                
            return payload
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    def create_access_token(self, data: Dict) -> str:
        """Create a new access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(seconds=self.access_token_expire)
        to_encode.update({"exp": expire})
        
        return jwt.encode(
            to_encode,
            self.jwt_secret,
            algorithm=self.algorithm
        )

    def create_refresh_token(self, data: Dict) -> str:
        """Create a new refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(seconds=self.refresh_token_expire)
        to_encode.update({"exp": expire})
        
        return jwt.encode(
            to_encode,
            self.jwt_secret,
            algorithm=self.algorithm
        )

    def verify_phi_access(self, token_data: Dict) -> bool:
        """Verify if the token has PHI access and session is within timeout."""
        if not token_data.get('phi_access'):
            return False
            
        last_activity = token_data.get('last_activity')
        if not last_activity:
            return False
            
        last_active = datetime.fromtimestamp(last_activity)
        timeout = datetime.utcnow() - timedelta(seconds=self.phi_session_timeout)
        
        return last_active > timeout

    def verify_device_trust(self, token_data: Dict) -> bool:
        """Verify if the device trust is valid."""
        trust_created = token_data.get('device_trust_created')
        if not trust_created:
            return False
            
        created_at = datetime.fromtimestamp(trust_created)
        expire = datetime.utcnow() - timedelta(seconds=self.device_trust_expire)
        
        return created_at > expire

    def _is_token_expired(self, payload: Dict) -> bool:
        """Check if token has expired."""
        exp = payload.get('exp')
        if not exp:
            return True
            
        return datetime.fromtimestamp(exp) < datetime.utcnow()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict:
    """Dependency for getting the current authenticated user."""
    security_service = SecurityService()
    token_data = security_service.decode_token(credentials.credentials)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
        
    return token_data 