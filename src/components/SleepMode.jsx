import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';
import { track } from '../utils/analytics';

export default function SleepMode({ appMode, onReset }) {
  const [inhale, setInhale] = useState(true);
  const [copied, setCopied] = useState(false);
  const isMorning = appMode === 'morning';

  const handleShare = async () => {
    track('share_tapped');
    const shareData = {
      title: 'Bedtime Mission',
      text: "We've been using this app for bedtime and our kids are obsessed 🚀 You complete a checklist then unlock a silly parent game — totally changed our bedtime routine. Try it:",
      url: 'https://bedtimemission.com',
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText('https://bedtimemission.com');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  useEffect(() => {
    const id = setInterval(() => setInhale(prev => !prev), 4000);
    return () => clearInterval(id);
  }, []);

  if (isMorning) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center p-8 text-center">
        <div className="flex flex-col items-center justify-center w-full">
          <p className="text-6xl mb-6">☀️</p>
          <h2 className="text-4xl font-black text-indigo-100 mb-4 leading-tight uppercase text-center">
            Have a wonderful day!
          </h2>
          <p className="text-xl font-bold text-indigo-300 mb-12 text-center">
            See you tonight for another mission.
          </p>
          <button
            onClick={onReset}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-black px-8 py-4 rounded-full text-sm uppercase tracking-widest transition-all shadow-lg"
          >
            End Morning &amp; Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center p-8 text-center">
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-48 h-48 bg-indigo-500/20 rounded-full flex items-center justify-center relative mb-6 mx-auto">
          <div className="breathe-circle w-32 h-32 bg-indigo-400/30 rounded-full flex items-center justify-center mx-auto">
            <div className="w-16 h-16 bg-indigo-300/50 rounded-full" />
          </div>
          <Moon className="absolute w-12 h-12 text-indigo-200 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <p className="text-indigo-400 text-base font-semibold mb-6 text-center">
          Now grab a book and wind down together&nbsp;📖
        </p>

        <h2 className="text-4xl font-black text-indigo-100 mb-4 leading-tight uppercase text-center">
          Sleep Mode
        </h2>
        <p className="text-2xl font-bold text-indigo-300 mb-12 text-center">
          {inhale ? 'Inhale...' : 'Exhale...'}
        </p>

        <button
          onClick={handleShare}
          className="border border-indigo-400/50 text-indigo-300 hover:text-white hover:border-indigo-300 font-bold text-xs uppercase tracking-[0.2em] px-6 py-2 rounded-full transition-colors block mx-auto text-center mb-4"
        >
          {copied ? 'Link copied!' : 'Share with a friend 🚀'}
        </button>

        <button
          onClick={onReset}
          className="text-indigo-400 font-bold text-xs uppercase underline decoration-2 underline-offset-4 tracking-[0.2em] hover:text-white transition-colors block mx-auto text-center"
        >
          End Day &amp; Reset
        </button>
      </div>
    </div>
  );
}
