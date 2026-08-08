'use client';

import Link from 'next/link';
import { Activity, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Features', href: '/#features' },
    { label: 'AI Healthcare', href: '/#ai-healthcare' },
    { label: 'Medicine Delivery', href: '/#medicine-delivery' },
    { label: 'Emergency SOS', href: '/#emergency' },
  ],
  Portals: [
    { label: 'Patient Portal', href: '/auth/login' },
    { label: 'Doctor Portal', href: '/auth/login' },
    { label: 'ASHA Worker Portal', href: '/auth/login' },
    { label: 'Pharmacy Portal', href: '/auth/login' },
    { label: 'Delivery Partner', href: '/auth/login' },
  ],
  Company: [
    { label: 'About Us', href: '/#' },
    { label: 'Contact', href: '/#contact' },
    { label: 'Privacy Policy', href: '/#' },
    { label: 'Terms of Service', href: '/#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Pit Pulse</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              AI-powered healthcare and medicine delivery platform connecting patients, doctors, ASHA workers, pharmacies, and delivery partners for better health outcomes.
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> support@pitpulse.health
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> +91 1800-HEALTH
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> New Delhi, India
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            (c) {new Date().getFullYear()} Pit Pulse. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <Link
                key={i}
                href="/#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
