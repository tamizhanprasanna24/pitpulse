'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types';

interface DashboardGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function DashboardGuard({ children, allowedRoles }: DashboardGuardProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user && !profile) {
      router.push('/auth/login');
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading Pit Pulse Dashboard...</p>
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

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
