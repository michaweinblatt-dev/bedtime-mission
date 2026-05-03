import { Rocket } from 'lucide-react';

export default function ProgressBar({ tasks }) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : (done / total) * 100;
  const width = pct > 5 ? `${pct}%` : '40px';

  return (
    <div className="max-w-3xl mx-auto w-full px-6 mb-8 z-10 relative">
      <div className="bg-slate-800/80 rounded-full h-10 border-4 border-indigo-400/30 overflow-hidden relative shadow-2xl backdrop-blur-sm">
        <div
          className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{ width }}
        >
          <Rocket className="w-6 h-6 text-white animate-rocket-fly" />
        </div>
      </div>
      <p className="text-center mt-3 text-indigo-200 font-black text-2xl drop-shadow-md tracking-tight uppercase">
        {done} / {total} Missions Complete
      </p>
    </div>
  );
}
