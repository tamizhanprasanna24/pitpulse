'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'AI Healthcare', href: '/#ai-healthcare' },
  { label: 'Medicine Delivery', href: '/#medicine-delivery' },
  { label: 'Nearby Care', href: '/#nearby-care' },
  { label: 'Emergency', href: '/#emergency' },
  { label: 'FAQ', href: '/#faq' },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong py-2' : 'py-4'
      )}
    >
      <nav className="container mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 overflow-hidden rounded-xl shadow-lg ring-1 ring-primary/20">
            <Image src="/logo.png" alt="Pit Pulse Logo" width={40} height={40} className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Pit<span className="gradient-text">Pulse</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
          <Link href="/auth/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/auth/register" className="hidden sm:block">
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white">
              Get Started
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 pt-8">
                <Link href="/" className="flex items-center gap-2.5">
                  <div className="relative flex h-10 w-10 overflow-hidden rounded-xl shadow-lg">
                    <Image src="/logo.png" alt="Pit Pulse Logo" width={40} height={40} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xl font-bold">Pit Pulse</span>
                </Link>
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/auth/register">
                      <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">
                        Get Started
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
