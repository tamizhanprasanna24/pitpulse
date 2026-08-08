'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import {
  Activity, Menu, X, Moon, Sun, LogOut, Bell, Search,
  ChevronRight, Home, CheckCheck, User, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
    { label: 'Profile', href: '/dashboard/patient/profile', icon: User },
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
    { label: 'Profile', href: '/dashboard/doctor/profile', icon: User },
    { label: 'Patients', href: '/dashboard/doctor/patients', icon: Activity },
    { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: Activity },
    { label: 'Emergency Cases', href: '/dashboard/doctor/emergency', icon: Activity },
    { label: 'Analytics', href: '/dashboard/doctor/analytics', icon: Activity },
    { label: 'User Management', href: '/dashboard/doctor/users', icon: Activity },
  ],
  asha: [
    { label: 'Dashboard', href: '/dashboard/asha', icon: Home },
    { label: 'Profile', href: '/dashboard/asha/profile', icon: User },
    { label: 'Home Visits', href: '/dashboard/asha/visits', icon: Activity },
    { label: 'Health Surveys', href: '/dashboard/asha/surveys', icon: Activity },
    { label: 'Vaccination Tracking', href: '/dashboard/asha/vaccinations', icon: Activity },
    { label: 'Patient Registration', href: '/dashboard/asha/register', icon: Activity },
    { label: 'Reports', href: '/dashboard/asha/reports', icon: Activity },
  ],
  pharmacy: [
    { label: 'Dashboard', href: '/dashboard/pharmacy', icon: Home },
    { label: 'Profile', href: '/dashboard/pharmacy/profile', icon: User },
    { label: 'Inventory', href: '/dashboard/pharmacy/inventory', icon: Activity },
    { label: 'Orders', href: '/dashboard/pharmacy/orders', icon: Activity },
    { label: 'Medicine Catalogue', href: '/dashboard/pharmacy/catalogue', icon: Activity },
  ],
  delivery: [
    { label: 'Dashboard', href: '/dashboard/delivery', icon: Home },
    { label: 'Profile', href: '/dashboard/delivery/profile', icon: User },
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

const roleProfileLabel: Record<UserRole, string> = {
  patient: 'View Profile',
  doctor: 'View Profile',
  asha: 'View Profile',
  pharmacy: 'View Profile',
  delivery: 'View Profile',
};

const roleProfileRoute: Record<UserRole, string> = {
  patient: '/dashboard/patient/profile',
  doctor: '/dashboard/doctor/profile',
  asha: '/dashboard/asha/profile',
  pharmacy: '/dashboard/pharmacy/profile',
  delivery: '/dashboard/delivery/profile',
};

const roleSecondAction: Record<UserRole, { label: string; href: string }> = {
  patient: { label: 'Health Tracker', href: '/dashboard/patient/health' },
  doctor: { label: 'Analytics', href: '/dashboard/doctor/analytics' },
  asha: { label: 'Reports', href: '/dashboard/asha/reports' },
  pharmacy: { label: 'Inventory', href: '/dashboard/pharmacy/inventory' },
  delivery: { label: 'Earnings', href: '/dashboard/delivery/earnings' },
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

  const [unreadCount, setUnreadCount] = React.useState(3);
  const [notificationsList, setNotificationsList] = React.useState([
    {
      id: 'n1',
      title: '🚨 Emergency SOS System Active',
      message: 'GPS emergency tracking & dispatch services are operational.',
      time: '10m ago',
      unread: true,
    },
    {
      id: 'n2',
      title: '💊 Medicine Order Out for Delivery',
      message: 'Order #ORD-8821 is being delivered by Vikram Singh.',
      time: '45m ago',
      unread: true,
    },
    {
      id: 'n3',
      title: '🩺 Appointment Confirmed',
      message: 'Consultation with Dr. Rajesh Verma confirmed for tomorrow.',
      time: '2h ago',
      unread: true,
    },
  ]);

  React.useEffect(() => setMounted(true), []);

  const activeProfile = profile || {
    id: 'user-default',
    email: 'guest@pitpulse.org',
    role: 'patient' as UserRole,
    full_name: 'Pit Pulse User',
  };

  // Infer active role from current URL route path to guarantee 100% portal alignment across all screens
  const pathParts = (pathname || '').split('/');
  const routeRole = pathParts[2] as UserRole;
  const validRoles: UserRole[] = ['patient', 'doctor', 'asha', 'pharmacy', 'delivery'];
  const currentRole = (validRoles.includes(routeRole) ? routeRole : profile?.role || 'patient') as UserRole;

  const navItems = navByRole[currentRole] || navByRole.patient;
  const roleLabel = roleLabels[currentRole] || roleLabels.patient;
  const profileLabel = roleProfileLabel[currentRole] || roleProfileLabel.patient;
  const profileRoute = roleProfileRoute[currentRole] || roleProfileRoute.patient;
  const secondAction = roleSecondAction[currentRole] || roleSecondAction.patient;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const markAllRead = () => {
    setUnreadCount(0);
    setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
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
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href={profileRoute}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/80 group cursor-pointer"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
              {getInitials(activeProfile.full_name || 'Pit Pulse')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">{activeProfile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{activeProfile.email}</p>
          </div>
        </Link>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {/* Interactive Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-2xl border-border/60">
              <div className="flex items-center justify-between border-b border-border/50 p-3 bg-card/60 backdrop-blur">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="h-3 w-3" /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                {notificationsList.length > 0 ? (
                  notificationsList.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-3 text-xs transition-colors hover:bg-muted/40',
                        n.unread ? 'bg-primary/5' : ''
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                      <p className="text-muted-foreground mt-1 leading-snug">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">No notifications yet</div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Interactive Profile Dropdown Menu - DYNAMIC FOR ALL ROLES */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-2 ring-primary/30 hover:ring-primary focus:outline-none transition-all shadow-sm">
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs font-bold">
                    {getInitials(activeProfile.full_name || 'Pit Pulse')}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-2xl border-border/60">
              <DropdownMenuLabel className="font-normal p-3 bg-muted/30">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{activeProfile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{activeProfile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(profileRoute)}
                className="cursor-pointer font-medium"
              >
                <User className="mr-2 h-4 w-4 text-primary" /> View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(secondAction.href)}
                className="cursor-pointer"
              >
                <Activity className="mr-2 h-4 w-4 text-accent" /> {secondAction.label}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  trend,
}: {
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

export function SectionCard({
  title,
  children,
  action,
}: {
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
