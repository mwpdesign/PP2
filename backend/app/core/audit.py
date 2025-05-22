from datetime import datetime
from sqlalchemy import Column, DateTime, String
from sqlalchemy.ext.declarative import declared_attr


class AuditMixin:
    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
            nullable=False
        )
    
    @declared_attr
    def created_by(cls):
        return Column(String(255), nullable=True)
    
    @declared_attr
    def updated_by(cls):
        return Column(String(255), nullable=True) 