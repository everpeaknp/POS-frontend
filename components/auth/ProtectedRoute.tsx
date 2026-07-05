"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'supervisor' | 'accountant' | 'viewer';
  requiredModule?: 'sales' | 'purchase' | 'inventory' | 'construction' | 'accounting' | 'reports' | 'pos' | 'hr' | 'hardware' | 'settings' | 'dashboard';
  requireFinancialAccess?: boolean;
  requireEditAccess?: boolean;
  fallbackPath?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps content that requires specific permissions.
 * Redirects to fallback path if user doesn't have required permissions.
 * 
 * Usage:
 * <ProtectedRoute requiredRole="admin">
 *   <AdminOnlyContent />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requiredModule="sales">
 *   <SalesContent />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredModule,
  requireFinancialAccess,
  requireEditAccess,
  fallbackPath = '/dashboard',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const permissions = usePermissions();
  const router = useRouter();
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Check role requirement
    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      router.push(fallbackPath);
      return;
    }
    
    // Check module access
    if (requiredModule && !permissions.canView(requiredModule)) {
      router.push(fallbackPath);
      return;
    }
    
    // Check financial access
    if (requireFinancialAccess && !permissions.canView('accounting')) {
      router.push(fallbackPath);
      return;
    }
    
    // Check edit access - just check if user is logged in
    if (requireEditAccess && !user) {
      router.push(fallbackPath);
      return;
    }
  }, [user, loading, requiredRole, requiredModule, requireFinancialAccess, requireEditAccess, permissions, router, fallbackPath]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  // Show nothing if not authenticated (will redirect)
  if (!user) {
    return null;
  }
  
  // Check permissions before rendering
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return null;
  }
  
  if (requiredModule && !permissions.canView(requiredModule)) {
    return null;
  }
  
  if (requireFinancialAccess && !permissions.canView('accounting')) {
    return null;
  }
  
  if (requireEditAccess && !user) {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * Permission Gate Component
 * 
 * Shows/hides content based on permissions without redirecting.
 * Useful for conditional UI elements.
 * 
 * Usage:
 * <PermissionGate requiredRole="admin">
 *   <AdminButton />
 * </PermissionGate>
 */
interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'supervisor' | 'accountant' | 'viewer';
  requiredModule?: 'sales' | 'purchase' | 'inventory' | 'construction' | 'accounting' | 'reports' | 'pos' | 'hr' | 'hardware' | 'settings' | 'dashboard';
  requireFinancialAccess?: boolean;
  requireEditAccess?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  requiredRole,
  requiredModule,
  requireFinancialAccess,
  requireEditAccess,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();
  const permissions = usePermissions();
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  // Check role requirement
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <>{fallback}</>;
  }
  
  // Check module access
  if (requiredModule && !permissions.canView(requiredModule)) {
    return <>{fallback}</>;
  }
  
  // Check financial access
  if (requireFinancialAccess && !permissions.canView('accounting')) {
    return <>{fallback}</>;
  }
  
  // Check edit access
  if (requireEditAccess && !user) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
