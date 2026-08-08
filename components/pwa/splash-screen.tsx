'use client';

import * as React from 'react';
import Image from 'next/image';

export function SplashScreen() {
  const [visible, setVisible] = React.useState(true);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if splash was already shown in this session
    const shown = sessionStorage.getItem('pitpulse_splash_shown');
    if (shown) {
      setVisible(false);
      return;
    }

    // Start smooth fade-out after 1.6s
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1600);

    // Hide completely after fade-out transition completes (2.0s total)
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('pitpulse_splash_shown', 'true');
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#090d16] transition-opacity duration-500 ease-in-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative h-full w-full max-w-[500px] flex items-center justify-center overflow-hidden p-4">
        <Image
          src="/splash.png"
          alt="Pit Pulse - Smart Rural Healthcare Management System"
          width={1500}
          height={2688}
          priority
          className="h-full w-auto max-h-screen object-contain drop-shadow-2xl select-none"
        />
      </div>
    </div>
  );
}
