'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, getDashboardRoute } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

interface DashboardGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function DashboardGuard({ children, allowedRoles }: DashboardGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;

    // 1. If unauthenticated, redirect to login
    if (!user && !profile) {
      toast.error('Session expired or unauthenticated. Please log in to access dashboard.');
      router.push('/auth/login');
      return;
    }

    if (profile) {
      const role = profile.role;
      const userHome = getDashboardRoute(role);

      // Determine required role for the current path
      let requiredRole: UserRole | null = null;
      if (pathname.startsWith('/dashboard/patient')) requiredRole = 'patient';
      else if (pathname.startsWith('/dashboard/doctor')) requiredRole = 'doctor';
      else if (pathname.startsWith('/dashboard/asha-worker')) requiredRole = 'asha';
      else if (pathname.startsWith('/dashboard/pharmacy')) requiredRole = 'pharmacy';
      else if (pathname.startsWith('/dashboard/delivery')) requiredRole = 'delivery';

      // 2. Strict Role Privacy Check: Block users from accessing another role's dashboard
      if (requiredRole && requiredRole !== role) {
        toast.error(`Access Denied: You do not have permission to view another role's dashboard.`);
        router.push(userHome);
        setAuthorized(false);
        return;
      }

      // 3. Custom allowedRoles array check if provided
      if (allowedRoles && !allowedRoles.includes(role)) {
        toast.error('Access Denied: Restricted page.');
        router.push(userHome);
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
    }
  }, [user, profile, loading, pathname, router, allowedRoles]);

  if (loading || (!authorized && (user || profile))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Verifying Security & Role Privacy...</p>
      </div>
    );
  }

  if (!user && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
