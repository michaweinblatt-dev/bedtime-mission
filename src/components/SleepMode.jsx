import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

export default function SleepMode({ onReset }) {
  const [inhale, setInhale] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setInhale(prev => !prev), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-48 h-48 bg-indigo-500/20 rounded-full flex items-center justify-center relative mb-12 mx-auto">
        <div className="breathe-circle w-32 h-32 bg-indigo-400/30 rounded-full flex items-center justify-center mx-auto">
          <div className="w-16 h-16 bg-indigo-300/50 rounded-full" />
        </div>
        <Moon className="absolute w-12 h-12 text-indigo-200 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <h2 className="text-4xl font-black text-indigo-100 mb-4 leading-tight uppercase text-center">
        Sleep Mode
      </h2>
      <p className="text-2xl font-bold text-indigo-300 mb-12 text-center">
        {inhale ? 'Inhale...' : 'Exhale...'}
      </p>

      <button
        onClick={onReset}
        className="text-indigo-400 font-bold text-xs uppercase underline decoration-2 underline-offset-4 tracking-[0.2em] hover:text-white transition-colors block mx-auto text-center"
      >
        End Day &amp; Reset
      </button>
    </div>
  );
}
