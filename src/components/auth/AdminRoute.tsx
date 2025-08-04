import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AdminRoute({ children, requiredPermission }: AdminRouteProps) {
  const { isAdmin, loading, hasPermission } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    // Redirect to login with return path
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
        <p className="text-sm text-gray-500 mt-2">Required permission: {requiredPermission}</p>
      </div>
    );
  }

  return <>{children}</>;
}