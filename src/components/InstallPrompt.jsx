import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { track } from '../utils/analytics';

const DISMISSED_KEY = 'pwa_install_dismissed';

function isIOS() {
  return /ipad|iphone|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && window.navigator.standalone === true)
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Never show if already running as installed PWA or user dismissed it
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    const isIosDevice = isIOS();
    setIos(isIosDevice);

    if (isIosDevice) {
      // iOS has no beforeinstallprompt — show manual instructions after a short delay
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    } else {
      // Android / Chrome: listen for the browser's install prompt
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') track('pwa_installed');
    dismiss();
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 pb-5 pointer-events-none">
      <div className="bg-indigo-950 border border-indigo-500/40 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl max-w-md mx-auto pointer-events-auto">
        <span className="text-xl shrink-0" aria-hidden="true">🚀</span>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-snug">
            Install Bedtime Mission
          </p>
          <p className="text-indigo-300 text-xs mt-0.5 leading-snug">
            {ios
              ? 'Tap Share then "Add to Home Screen"'
              : 'Add to your home screen for the full experience'}
          </p>
        </div>

        {!ios && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0 transition-colors active:scale-95"
          >
            Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="text-indigo-400 hover:text-white transition-colors shrink-0 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
