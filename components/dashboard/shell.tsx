'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import {
  Activity, Menu, X, Moon, Sun, LogOut, Bell, Search,
  ChevronRight, Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/health-utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Activity;
}

const navByRole: Record<UserRole, NavItem[]> = {
  patient: [
    { label: 'Dashboard', href: '/dashboard/patient', icon: Home },
    { label: 'Health Tracker', href: '/dashboard/patient/health', icon: Activity },
    { label: 'Medicines', href: '/dashboard/patient/medicines', icon: Activity },
    { label: 'Orders', href: '/dashboard/patient/orders', icon: Activity },
    { label: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: Activity },
    { label: 'Appointments', href: '/dashboard/patient/appointments', icon: Activity },
    { label: 'Lab Reports', href: '/dashboard/patient/lab-reports', icon: Activity },
    { label: 'Nearby Care', href: '/dashboard/patient/maps', icon: Activity },
    { label: 'AI Assistant', href: '/dashboard/patient/ai-assistant', icon: Activity },
    { label: 'Pregnancy', href: '/dashboard/patient/pregnancy', icon: Activity },
  ],
  doctor: [
    { label: 'Dashboard', href: '/dashboard/doctor', icon: Home },
    { label: 'Patients', href: '/dashboard/doctor/patients', icon: Activity },
    { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: Activity },
    { label: 'Emergency Cases', href: '/dashboard/doctor/emergency', icon: Activity },
    { label: 'Analytics', href: '/dashboard/doctor/analytics', icon: Activity },
    { label: 'User Management', href: '/dashboard/doctor/users', icon: Activity },
  ],
  asha: [
    { label: 'Dashboard', href: '/dashboard/asha', icon: Home },
    { label: 'Home Visits', href: '/dashboard/asha/visits', icon: Activity },
    { label: 'Health Surveys', href: '/dashboard/asha/surveys', icon: Activity },
    { label: 'Vaccination Tracking', href: '/dashboard/asha/vaccinations', icon: Activity },
    { label: 'Patient Registration', href: '/dashboard/asha/register', icon: Activity },
    { label: 'Reports', href: '/dashboard/asha/reports', icon: Activity },
  ],
  pharmacy: [
    { label: 'Dashboard', href: '/dashboard/pharmacy', icon: Home },
    { label: 'Inventory', href: '/dashboard/pharmacy/inventory', icon: Activity },
    { label: 'Orders', href: '/dashboard/pharmacy/orders', icon: Activity },
    { label: 'Medicine Catalogue', href: '/dashboard/pharmacy/catalogue', icon: Activity },
  ],
  delivery: [
    { label: 'Dashboard', href: '/dashboard/delivery', icon: Home },
    { label: 'Assigned Orders', href: '/dashboard/delivery/orders', icon: Activity },
    { label: 'Earnings', href: '/dashboard/delivery/earnings', icon: Activity },
    { label: 'Delivery History', href: '/dashboard/delivery/history', icon: Activity },
  ],
};

const roleLabels: Record<UserRole, string> = {
  patient: 'Patient Portal',
  doctor: 'Doctor / Admin Portal',
  asha: 'ASHA Worker Portal',
  pharmacy: 'Pharmacy Portal',
  delivery: 'Delivery Partner Portal',
};

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardShell({ children, title, description }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const activeProfile = profile || {
    id: 'user-default',
    email: 'guest@pitpulse.org',
    role: 'patient' as UserRole,
    full_name: 'Pit Pulse User',
  };

  const navItems = navByRole[activeProfile.role] || navByRole.patient;
  const roleLabel = roleLabels[activeProfile.role] || roleLabels.patient;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-4 py-4">
        <div className="relative flex h-10 w-10 overflow-hidden rounded-xl shadow-lg ring-1 ring-primary/20">
          <Image src="/logo.png" alt="Pit Pulse Logo" width={40} height={40} className="h-full w-full object-cover" />
        </div>
        <div>
          <span className="text-lg font-bold">Pit Pulse</span>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
              {getInitials(activeProfile.full_name || 'Pit Pulse')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{activeProfile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{activeProfile.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="mt-2 w-full justify-start text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/30 lg:block">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/50 px-4 backdrop-blur-lg lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="w-48 pl-10" />
            </div>
          </div>

          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
              {getInitials(activeProfile.full_name || 'Pit Pulse')}
            </AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, unit, color, trend }: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="glass rounded-xl p-5 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <Badge variant="secondary" className="text-xs">
            {trend}
          </Badge>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground"> {unit}</span>}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function SectionCard({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
