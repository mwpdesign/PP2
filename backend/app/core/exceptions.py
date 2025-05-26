"""Custom exceptions for the application."""
from fastapi import HTTPException, status


class BaseAppException(HTTPException):
    """Base exception for all application exceptions."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: dict = None
    ) -> None:
        """Initialize exception."""
        super().__init__(status_code=status_code, detail=detail)
        self.headers = headers


class AuthenticationException(BaseAppException):
    """Exception raised for authentication errors."""

    def __init__(self, detail: str = "Authentication failed") -> None:
        """Initialize exception."""
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class AuthorizationException(BaseAppException):
    """Exception raised for authorization errors."""

    def __init__(self, detail: str = "Not authorized") -> None:
        """Initialize exception."""
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class ValidationException(BaseAppException):
    """Exception raised for validation errors."""

    def __init__(self, detail: str = "Validation error") -> None:
        """Initialize exception."""
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class NotFoundException(BaseAppException):
    """Exception raised when a resource is not found."""

    def __init__(self, detail: str = "Resource not found") -> None:
        """Initialize exception."""
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class ConflictException(BaseAppException):
    """Exception raised when there is a conflict."""

    def __init__(self, detail: str = "Resource conflict") -> None:
        """Initialize exception."""
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class ShippingException(BaseAppException):
    """Exception raised for shipping errors."""

    def __init__(self, detail: str = "Shipping error") -> None:
        """Initialize exception."""
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class ValidationError(HTTPException):
    """Raised when validation fails."""
    def __init__(self, detail: str):
        """Initialize the exception with a detail message."""
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class AuthenticationError(HTTPException):
    """Raised when authentication fails."""
    def __init__(self, detail: str = "Could not validate credentials"):
        """Initialize the exception with a detail message."""
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Raised when authorization fails."""
    def __init__(self, detail: str = "Not enough permissions"):
        """Initialize the exception with a detail message."""
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class NotFoundError(HTTPException):
    """Raised when a resource is not found."""
    def __init__(self, detail: str = "Resource not found"):
        """Initialize the exception with a detail message."""
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class ConflictError(HTTPException):
    """Raised when there is a conflict with existing data."""
    def __init__(self, detail: str = "Resource already exists"):
        """Initialize the exception with a detail message."""
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class UnauthorizedError(HTTPException):
    """Raised when access is unauthorized."""
    def __init__(self, detail: str = "Unauthorized access"):
        """Initialize the exception with a detail message."""
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        ) 