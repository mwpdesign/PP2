import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { cognitoService } from '../../services/cognito';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireMFA?: boolean;
  requirePHIAccess?: boolean;
  territoryId?: number;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireMFA = false,
  requirePHIAccess = false,
  territoryId
}) => {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const tokenData = await cognitoService.verifyToken();

        // Check if token is valid
        if (!tokenData.valid) {
          setIsAuthorized(false);
          return;
        }

        // Check MFA requirement
        if (requireMFA && !tokenData.user.mfa_verified) {
          setIsAuthorized(false);
          return;
        }

        // Check PHI access requirement
        if (requirePHIAccess && !tokenData.phiAccess) {
          setIsAuthorized(false);
          return;
        }

        // Check territory access if specified
        if (territoryId && !tokenData.user.territories.includes(territoryId)) {
          setIsAuthorized(false);
          return;
        }

        // Check required roles
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role =>
            tokenData.user.roles.includes(role)
          );
          if (!hasRequiredRole) {
            setIsAuthorized(false);
            return;
          }
        }

        // Check required permissions
        if (requiredPermissions.length > 0) {
          const hasRequiredPermission = requiredPermissions.some(permission =>
            tokenData.user.permissions.includes(permission)
          );
          if (!hasRequiredPermission) {
            setIsAuthorized(false);
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [
    requireMFA,
    requirePHIAccess,
    territoryId,
    requiredRoles,
    requiredPermissions
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default RoleGuard; 