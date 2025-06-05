"""Configuration management API endpoints."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config_manager import (
    ConfigManager,
    get_config_manager,
    get_configuration_status
)
from app.core.config_validator import ValidationLevel

router = APIRouter()


class ConfigStatusResponse(BaseModel):
    """Configuration status response model."""
    environment_info: Dict[str, Any]
    security_check: Dict[str, Any]
    missing_required_vars: List[str]
    validation_passed: bool


class ValidationResultModel(BaseModel):
    """Validation result model."""
    level: str
    message: str
    key: str = None
    value: str = None
    suggestion: str = None


class ConfigValidationResponse(BaseModel):
    """Configuration validation response model."""
    is_valid: bool
    results: List[ValidationResultModel]
    summary: Dict[str, int]


class EnvironmentInfoResponse(BaseModel):
    """Environment information response model."""
    environment: str
    debug_mode: bool
    auth_mode: str
    use_cognito: bool
    database_url_configured: bool
    encryption_enabled: bool
    cors_origins_count: int
    validation_status: str


@router.get("/status", response_model=ConfigStatusResponse)
async def get_config_status():
    """Get comprehensive configuration status."""
    try:
        status = get_configuration_status()
        return ConfigStatusResponse(**status)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get configuration status: {str(e)}"
        )


@router.get("/validate", response_model=ConfigValidationResponse)
async def validate_configuration(
    environment: str = None,
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Validate current configuration."""
    try:
        # Run validation
        results = config_manager.validator.validate_all()
        is_valid = config_manager.validator.is_valid()

        # Convert results to response format
        result_models = []
        for result in results:
            result_models.append(ValidationResultModel(
                level=result.level.value,
                message=result.message,
                key=result.key,
                value=result.value,
                suggestion=result.suggestion
            ))

        # Generate summary
        summary = {
            "errors": len([r for r in results
                          if r.level == ValidationLevel.ERROR]),
            "warnings": len([r for r in results
                            if r.level == ValidationLevel.WARNING]),
            "info": len([r for r in results
                        if r.level == ValidationLevel.INFO])
        }

        return ConfigValidationResponse(
            is_valid=is_valid,
            results=result_models,
            summary=summary
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Configuration validation failed: {str(e)}"
        )


@router.get("/environment", response_model=EnvironmentInfoResponse)
async def get_environment_info(
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Get environment information."""
    try:
        env_info = config_manager.get_environment_info()
        return EnvironmentInfoResponse(**env_info)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get environment info: {str(e)}"
        )


@router.get("/missing-vars")
async def get_missing_required_vars(
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Get list of missing required environment variables."""
    try:
        missing_vars = config_manager.check_required_env_vars()
        return {
            "missing_variables": missing_vars,
            "count": len(missing_vars),
            "all_present": len(missing_vars) == 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check missing variables: {str(e)}"
        )


@router.get("/security-check")
async def get_security_check(
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Get security configuration check."""
    try:
        security_check = config_manager.check_security_configuration()
        return security_check
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Security check failed: {str(e)}"
        )


@router.get("/report")
async def get_validation_report(
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Get full validation report as text."""
    try:
        report = config_manager.get_validation_report()
        return {
            "report": report,
            "timestamp": "generated_on_request"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.post("/validate-encryption")
async def validate_encryption_setup(
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Validate encryption configuration."""
    try:
        is_valid = config_manager.validate_encryption_setup()
        return {
            "encryption_valid": is_valid,
            "message": ("Encryption setup is valid" if is_valid
                        else "Encryption setup has issues")
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Encryption validation failed: {str(e)}"
        )


@router.post("/validate-database")
async def validate_database_config(
    config_manager: ConfigManager = Depends(get_config_manager)
):
    """Validate database configuration."""
    try:
        is_valid = config_manager.validate_database_config()
        return {
            "database_valid": is_valid,
            "message": ("Database configuration is valid" if is_valid
                        else "Database configuration has issues")
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database validation failed: {str(e)}"
        )