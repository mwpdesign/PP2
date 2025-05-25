"""
Role-based access control models with territory management.
"""
from datetime import datetime
from typing import List, Optional, Set
from sqlalchemy import (
    String, Integer, ForeignKey, Table, Boolean, JSON, DateTime, Column
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from ...core.database import Base


# Association tables
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column(
        'role_id',
        Integer,
        ForeignKey('roles.id', ondelete='CASCADE')
    ),
    Column(
        'permission_id',
        Integer,
        ForeignKey('permissions.id', ondelete='CASCADE')
    )
)

user_roles = Table(
    'user_roles',
    Base.metadata,
    Column(
        'user_id',
        Integer,
        ForeignKey('users.id', ondelete='CASCADE')
    ),
    Column(
        'role_id',
        Integer,
        ForeignKey('roles.id', ondelete='CASCADE')
    ),
    Column(
        'territory_id',
        Integer,
        ForeignKey('territories.id', ondelete='CASCADE')
    )
)

role_hierarchies = Table(
    'role_hierarchies',
    Base.metadata,
    Column(
        'parent_role_id',
        Integer,
        ForeignKey('roles.id', ondelete='CASCADE')
    ),
    Column(
        'child_role_id',
        Integer,
        ForeignKey('roles.id', ondelete='CASCADE')
    )
)


class Permission(Base):
    """Permission model for granular access control."""
    __tablename__ = 'permissions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    # e.g., 'patient', 'provider', 'ivr'
    resource: Mapped[str] = mapped_column(String(50))
    # e.g., 'read', 'write', 'delete'
    action: Mapped[str] = mapped_column(String(50))
    # Additional conditions for permission
    conditions: Mapped[dict] = mapped_column(JSON)
    requires_mfa: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_phi_access: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    roles: Mapped[List["Role"]] = relationship(
        'Role',
        secondary=role_permissions,
        back_populates='permissions'
    )


class Role(Base):
    """Role model with hierarchical support."""
    __tablename__ = 'roles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_mfa: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_phi_access: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    permissions: Mapped[List[Permission]] = relationship(
        'Permission',
        secondary=role_permissions,
        back_populates='roles'
    )
    users: Mapped[List["User"]] = relationship(
        'User',
        secondary=user_roles,
        back_populates='roles'
    )
    
    # Hierarchical relationships
    parent_roles: Mapped[List["Role"]] = relationship(
        'Role',
        secondary=role_hierarchies,
        primaryjoin=id == role_hierarchies.c.child_role_id,
        secondaryjoin=id == role_hierarchies.c.parent_role_id,
        backref='child_roles'
    )


class Territory(Base):
    """Territory model for geographic access control."""
    __tablename__ = 'territories'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('territories.id', ondelete='CASCADE')
    )
    # GeoJSON for territory boundaries
    boundary: Mapped[dict] = mapped_column(JSON)
    # Additional territory metadata
    metadata: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    parent: Mapped[Optional["Territory"]] = relationship(
        'Territory',
        remote_side=[id],
        backref='children'
    )
    users: Mapped[List["User"]] = relationship(
        'User',
        secondary=user_roles,
        back_populates='users'
    )


class User(Base):
    """Extended user model with role and territory associations."""
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cognito_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_mfa: Mapped[bool] = mapped_column(Boolean, default=False)
    phi_access_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    roles: Mapped[List[Role]] = relationship(
        'Role',
        secondary=user_roles,
        back_populates='users'
    )
    territories: Mapped[List[Territory]] = relationship(
        'Territory',
        secondary=user_roles,
        back_populates='users'
    )

    def has_permission(
        self,
        permission_name: str,
        territory_id: Optional[int] = None
    ) -> bool:
        """Check if user has a specific permission in a territory."""
        for role in self.roles:
            # Check direct permissions
            if any(p.name == permission_name for p in role.permissions):
                if not territory_id or any(
                    t.id == territory_id for t in self.territories
                ):
                    return True
            
            # Check inherited permissions through role hierarchy
            for parent_role in role.parent_roles:
                if any(p.name == permission_name for p in parent_role.permissions):
                    if not territory_id or any(
                        t.id == territory_id for t in self.territories
                    ):
                        return True
        
        return False

    def get_territories(self) -> List[Territory]:
        """Get all territories user has access to."""
        return self.territories

    def get_effective_permissions(self) -> List[Permission]:
        """Get all effective permissions including inherited ones."""
        permissions: Set[Permission] = set()
        for role in self.roles:
            # Add direct permissions
            permissions.update(role.permissions)
            
            # Add inherited permissions
            for parent_role in role.parent_roles:
                permissions.update(parent_role.permissions)
        
        return list(permissions) 