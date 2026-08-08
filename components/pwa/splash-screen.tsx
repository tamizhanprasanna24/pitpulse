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

    // Start smooth fade-out after 1.5s
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1500);

    // Hide completely after fade-out transition completes (1.9s total)
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('pitpulse_splash_shown', 'true');
    }, 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#090d16] transition-opacity duration-500 ease-in-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-700">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 p-2 shadow-[0_0_80px_rgba(14,165,233,0.35)] ring-1 ring-white/10 animate-pulse">
          <Image
            src="/logo.png"
            alt="Pit Pulse Logo"
            width={128}
            height={128}
            priority
            className="h-full w-full object-cover rounded-2xl drop-shadow-xl"
          />
        </div>

        {/* Animated Brand Name & Tagline */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Pit <span className="bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">Pulse</span>
          </h1>
          <p className="text-xs font-semibold tracking-widest text-sky-400/80 uppercase">
            Care &bull; Connect &bull; Health
          </p>
        </div>
      </div>
    </div>
  );
}
