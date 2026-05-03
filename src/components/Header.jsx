import { User } from 'lucide-react';
import { formatTime, getElapsed } from '../utils/helpers';

export default function Header({ appState, tick, subtitle }) {
  const isShared = appState.activeProfileId === 'shared';
  const p = appState.profiles[appState.activeProfileId];
  if (!p) return null;

  const title = isShared ? 'Bedtime Mission' : `${p.name}'s Bedtime Mission`;
  const elapsed = getElapsed(p);
  const showTimer = !!p.missionStartTime;

  // tick is passed just to trigger a re-render every second; elapsed is derived fresh each render
  void tick;

  return (
    <header className="pb-4 px-4 text-center z-10 relative">
      {/* Avatar */}
      {!isShared && (
        <div className="mb-4 flex justify-center">
          <div className="astronaut-visor w-24 h-24 flex items-center justify-center border-white/50 shadow-2xl">
            {p.avatar
              ? <img src={p.avatar} className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-indigo-300" />
            }
          </div>
        </div>
      )}

      <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 drop-shadow-lg mb-2 uppercase tracking-tighter text-center">
        {title}
      </h1>
      <p className="text-indigo-200 text-sm md:text-base font-bold tracking-wide text-center text-slate-100">
        {subtitle}
      </p>

      <p className="mt-2 text-[11px] text-indigo-400/60 text-center whitespace-nowrap overflow-hidden text-ellipsis">
        Basics &rarr; Tonight&apos;s Game &rarr; Read &amp; Time for Sleep 🌙
      </p>

      {/* Mission timer */}
      <div
        className={`inline-block mt-4 px-6 py-2 rounded-full bg-slate-800/50 border border-indigo-500/30 text-indigo-300 font-mono text-2xl shadow-inner mb-2 transition-opacity ${showTimer ? 'opacity-100' : 'opacity-0'}`}
      >
        <span>{formatTime(elapsed)}</span>
        {p.bestTime !== null && (
          <span className="text-pink-400 ml-3 border-l border-indigo-500/30 pl-3">
            Best: {formatTime(p.bestTime)}
          </span>
        )}
      </div>
    </header>
  );
}
