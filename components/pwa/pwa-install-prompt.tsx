'use client';

import * as React from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pitpulse_pwa_install_dismissed';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as any).standalone === true);

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check iOS
    const userAgent = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check dismissal status
    const dismissedTime = localStorage.getItem(DISMISS_KEY);
    if (dismissedTime && Date.now() - Number(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Capture Chrome/Android/Desktop install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after brief delay for iOS if not dismissed
    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      toast.info('PWA Installation', {
        description: 'To install, open your browser menu and tap "Add to Home screen" or "Install App".',
      });
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast.success('Thank you for installing Pit Pulse!');
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    toast.info('Install banner hidden for 7 days', {
      description: 'You can install anytime from browser menu.',
    });
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Floating PWA Install Card */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300">
        <Card className="glass-strong border-primary/30 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
              <Smartphone className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Install Pit Pulse App</span>
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                Install as a standalone application for fast offline access, emergency SOS, and medicine tracking.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1 bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold shadow"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Install Application
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground"
            >
              Later
            </Button>
          </div>
        </Card>
      </div>

      {/* iOS Installation Helper Modal */}
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="h-5 w-5 text-primary" /> Install on iOS / Safari
            </DialogTitle>
            <DialogDescription>
              Follow these simple steps to install Pit Pulse on your iPhone or iPad home screen:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                1
              </div>
              <div>
                <p className="font-semibold text-xs">Tap the Share Button</p>
                <p className="text-xs text-muted-foreground">
                  Tap the <Share className="inline h-3.5 w-3.5 text-primary" /> Share icon in the Safari toolbar (bottom on iPhone, top on iPad).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                2
              </div>
              <div>
                <p className="font-semibold text-xs">Select &quot;Add to Home Screen&quot;</p>
                <p className="text-xs text-muted-foreground">
                  Scroll down the share options list and tap <PlusSquare className="inline h-3.5 w-3.5 text-primary" /> <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                3
              </div>
              <div>
                <p className="font-semibold text-xs">Tap &quot;Add&quot;</p>
                <p className="text-xs text-muted-foreground">
                  Tap <strong>Add</strong> in the top right corner. The Pit Pulse icon will appear on your home screen!
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowIOSModal(false)} className="w-full bg-primary text-white text-xs">
            Got it, thanks!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
