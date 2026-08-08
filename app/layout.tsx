import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/context/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { SplashScreen } from '@/components/pwa/splash-screen';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Pit Pulse - Smart Healthcare Management System',
  description:
    'Connecting Patients, Doctors, ASHA Workers, Pharmacies, and Delivery Partners through intelligent healthcare, emergency response, and real-time medicine delivery.',
  manifest: '/manifest.json',
  applicationName: 'Pit Pulse',
  themeColor: '#0ea5e9',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pit Pulse Healthcare',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Pit Pulse - Smart Healthcare Management System',
    description:
      'Connecting Patients, Doctors, ASHA Workers, Pharmacies, and Delivery Partners through intelligent healthcare, emergency response, and real-time medicine delivery.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased selection:bg-primary/20`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SplashScreen />
            {children}
            <Toaster position="top-right" richColors />
            <ServiceWorkerRegister />
            <PWAInstallPrompt />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
