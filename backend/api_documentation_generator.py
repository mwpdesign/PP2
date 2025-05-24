"""API documentation generator for Healthcare IVR Platform."""
import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


class APIDocumentationGenerator:
    """Generate comprehensive API documentation."""

    def __init__(self, app: FastAPI):
        """Initialize with FastAPI application."""
        self.app = app
        self.docs_dir = os.path.join(os.path.dirname(__file__), "api_docs")
        os.makedirs(self.docs_dir, exist_ok=True)

    def generate_openapi_spec(self) -> Dict[str, Any]:
        """Generate OpenAPI specification."""
        openapi_schema = get_openapi(
            title="Healthcare IVR Platform API",
            version="1.0.0",
            description=self._get_api_description(),
            routes=self.app.routes
        )

        # Add security schemes
        openapi_schema["components"]["securitySchemes"] = {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            }
        }

        # Add global security requirement
        openapi_schema["security"] = [{"bearerAuth": []}]

        # Add HIPAA compliance info
        openapi_schema["info"]["x-hipaa-compliance"] = {
            "compliant": True,
            "audit_logging": True,
            "data_encryption": True,
            "access_control": "role-based",
            "phi_handling": "encrypted-in-transit-and-at-rest"
        }

        # Add API versioning info
        openapi_schema["info"]["x-api-versioning"] = {
            "current": "v1",
            "supported": ["v1"],
            "deprecation_policy": "https://api.healthcareivr.com/deprecation-policy"
        }

        # Save OpenAPI spec
        spec_path = os.path.join(self.docs_dir, "openapi.json")
        with open(spec_path, "w") as f:
            json.dump(openapi_schema, f, indent=2)

        return openapi_schema

    def _get_api_description(self) -> str:
        """Get comprehensive API description."""
        return """
# Healthcare IVR Platform API

## Overview
This API provides a comprehensive interface for managing a HIPAA-compliant healthcare IVR platform.

## Key Features
- User Management & Authentication
- Organization Management
- Role-Based Access Control (RBAC)
- IVR Flow Management
- Patient Data Management
- Audit Logging
- Real-time Analytics

## Authentication
All API endpoints require JWT authentication. Tokens can be obtained through the `/users/login` endpoint.

## Rate Limiting
- Standard tier: 100 requests/minute
- Enterprise tier: 1000 requests/minute

## HIPAA Compliance
This API is fully HIPAA compliant with:
- End-to-end encryption
- Comprehensive audit logging
- Role-based access control
- Data retention policies
- PHI handling procedures

## Error Handling
Standard error responses follow RFC 7807 (Problem Details for HTTP APIs).

## Versioning
API versioning is handled through the URL path (/v1/, /v2/, etc.).
"""

    def generate_endpoint_documentation(self) -> Dict[str, Any]:
        """Generate detailed endpoint documentation."""
        endpoints = {}
        
        for route in self.app.routes:
            if hasattr(route, "methods"):
                path = route.path
                for method in route.methods:
                    if not path in endpoints:
                        endpoints[path] = {}
                    
                    endpoints[path][method.lower()] = {
                        "summary": route.name,
                        "description": route.description or "",
                        "parameters": self._get_endpoint_parameters(route),
                        "requestBody": self._get_request_body(route),
                        "responses": self._get_responses(route),
                        "security": [{"bearerAuth": []}],
                        "tags": self._get_endpoint_tags(route)
                    }

        # Save endpoint documentation
        doc_path = os.path.join(self.docs_dir, "endpoints.json")
        with open(doc_path, "w") as f:
            json.dump(endpoints, f, indent=2)

        return endpoints

    def _get_endpoint_parameters(self, route) -> List[Dict]:
        """Extract endpoint parameters."""
        params = []
        if hasattr(route, "dependencies"):
            for dep in route.dependencies:
                if hasattr(dep, "model"):
                    params.extend(self._model_to_parameters(dep.model))
        return params

    def _get_request_body(self, route) -> Optional[Dict]:
        """Extract request body schema."""
        if hasattr(route, "body_field"):
            return {
                "content": {
                    "application/json": {
                        "schema": self._model_to_schema(route.body_field.type_)
                    }
                }
            }
        return None

    def _get_responses(self, route) -> Dict:
        """Generate response documentation."""
        responses = {
            "200": {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": self._get_response_schema(route)
                    }
                }
            },
            "400": {
                "description": "Bad request",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "401": {
                "description": "Unauthorized",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "403": {
                "description": "Forbidden",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "404": {
                "description": "Not found",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "500": {
                "description": "Internal server error",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "detail": {"type": "string"}
                            }
                        }
                    }
                }
            }
        }
        return responses

    def _get_response_schema(self, route) -> Dict:
        """Extract response schema."""
        if hasattr(route, "response_field"):
            return self._model_to_schema(route.response_field.type_)
        return {"type": "object"}

    def _model_to_schema(self, model) -> Dict:
        """Convert Pydantic model to JSON schema."""
        if hasattr(model, "schema"):
            return model.schema()
        return {"type": "object"}

    def _model_to_parameters(self, model) -> List[Dict]:
        """Convert Pydantic model to parameters."""
        params = []
        if hasattr(model, "__fields__"):
            for name, field in model.__fields__.items():
                params.append({
                    "name": name,
                    "in": "query",
                    "required": field.required,
                    "schema": self._model_to_schema(field.type_)
                })
        return params

    def _get_endpoint_tags(self, route) -> List[str]:
        """Get endpoint tags based on path."""
        path = route.path.strip("/")
        parts = path.split("/")
        if len(parts) > 1:
            return [parts[1]]
        return ["default"]

    def generate_api_documentation(self) -> Dict[str, Any]:
        """Generate complete API documentation."""
        openapi_spec = self.generate_openapi_spec()
        endpoints = self.generate_endpoint_documentation()

        documentation = {
            "generated_at": datetime.now().isoformat(),
            "openapi_spec": openapi_spec,
            "endpoints": endpoints,
            "metadata": {
                "version": "1.0.0",
                "base_url": "https://api.healthcareivr.com",
                "support_email": "api-support@healthcareivr.com",
                "deprecation_policy": "https://api.healthcareivr.com/deprecation-policy"
            }
        }

        # Save complete documentation
        doc_path = os.path.join(self.docs_dir, "api_documentation.json")
        with open(doc_path, "w") as f:
            json.dump(documentation, f, indent=2)

        return documentation


def generate_markdown_docs(documentation: Dict[str, Any]) -> str:
    """Generate Markdown documentation from API spec."""
    md = f"""# Healthcare IVR Platform API Documentation
Generated at: {documentation['generated_at']}

{documentation['openapi_spec']['info']['description']}

## Base URL
{documentation['metadata']['base_url']}

## Authentication
Bearer token authentication is required for all endpoints.
Token format: `Authorization: Bearer <token>`

## Endpoints

"""
    
    for path, methods in documentation["endpoints"].items():
        md += f"### {path}\n\n"
        for method, details in methods.items():
            md += f"#### {method.upper()}\n\n"
            md += f"**Summary:** {details['summary']}\n\n"
            if details['description']:
                md += f"**Description:** {details['description']}\n\n"
            
            if details['parameters']:
                md += "**Parameters:**\n\n"
                for param in details['parameters']:
                    md += f"- `{param['name']}` ({param['in']}): "
                    md += f"{'Required' if param['required'] else 'Optional'}\n"
            
            if details['requestBody']:
                md += "**Request Body:**\n\n```json\n"
                md += json.dumps(
                    details['requestBody']['content']['application/json']['schema'],
                    indent=2
                )
                md += "\n```\n\n"
            
            md += "**Responses:**\n\n"
            for status, response in details['responses'].items():
                md += f"- {status}: {response['description']}\n"
            
            md += "\n---\n\n"

    # Save Markdown documentation
    docs_dir = os.path.dirname(documentation['metadata']['base_url'])
    md_path = os.path.join(docs_dir, "api_documentation.md")
    with open(md_path, "w") as f:
        f.write(md)

    return md


def main():
    """Generate API documentation."""
    from app.main import app  # Import your FastAPI app
    
    generator = APIDocumentationGenerator(app)
    documentation = generator.generate_api_documentation()
    markdown_docs = generate_markdown_docs(documentation)
    
    print(f"Documentation generated in: {generator.docs_dir}")


if __name__ == "__main__":
    main() 