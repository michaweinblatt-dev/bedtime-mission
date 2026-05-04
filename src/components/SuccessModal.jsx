import { useState } from 'react';
import { Zap, RefreshCw, Play, Square, Moon } from 'lucide-react';
import { formatTime } from '../utils/helpers';
import { SPACE_DJ_PLAYLIST, HANDOFF_LINES } from '../utils/constants';

export default function SuccessModal({
  reward,
  rewardTimeLeft,
  unlockedCount,
  nightNumber,
  isPlayingBeat,
  currentTrackIndex,
  finalTimes,
  onAdjustTimer,
  onSpin,
  onToggleBeat,
  onSetTrack,
  onShowStats,
  onSleepMode,
}) {
  const [handoffLine] = useState(() => HANDOFF_LINES[Math.floor(Math.random() * HANDOFF_LINES.length)]);

  const showMusic = reward.title.includes('Dance') || reward.title.includes('DJ');

  function BeatButton() {
    if (isPlayingBeat) {
      return (
        <button
          onClick={onToggleBeat}
          className="w-full bg-pink-500 hover:bg-pink-400 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <Square className="w-5 h-5 fill-current text-white" /> Stop Music
        </button>
      );
    }
    return (
      <button
        onClick={onToggleBeat}
        className="w-full bg-pink-500 hover:bg-pink-400 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        <Play className="w-5 h-5 fill-current text-white" /> Play DJ Track
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md text-slate-800">
      <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-md w-full mx-4 text-center shadow-2xl h-[95vh] sm:h-auto overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6 text-emerald-500">
          <Zap className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Mission Success</h2>
        </div>

        {/* Handoff line */}
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-pink-500 mb-4">
          {handoffLine}
        </p>

        {/* Prize card */}
        <div className="bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-[32px] p-6 relative shadow-xl text-white mb-6 flex-grow flex flex-col justify-center border-4 border-indigo-400">
          <div className="bg-yellow-400 text-yellow-950 text-[11px] font-black uppercase tracking-[0.2em] py-2 px-6 rounded-full absolute -top-4 left-1/2 -translate-x-1/2 shadow-lg border-2 border-white whitespace-nowrap">
            Tonight&apos;s Prize Game
          </div>

          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 opacity-80 text-center">
            Collection: {unlockedCount} of 10 Unlocked
          </div>
          <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-indigo-400/50 text-center">
            Night {nightNumber} of 10
          </div>

          <p className="text-2xl sm:text-3xl font-black mb-4 leading-tight drop-shadow-md uppercase text-white">
            {reward.title}
          </p>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 mb-4 text-center">
            <p className="text-[10px] font-black uppercase text-indigo-300 mb-1 tracking-[0.2em]">Instructions:</p>
            <p className="text-sm font-bold leading-relaxed text-indigo-50">{reward.desc}</p>
          </div>

          {/* Music section */}
          {showMusic && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.2em]">Space DJ Deck:</p>
              <div className="grid grid-cols-2 gap-2">
                {SPACE_DJ_PLAYLIST.map((track, i) => (
                  <button
                    key={track.id}
                    onClick={() => onSetTrack(i)}
                    className={`px-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all leading-tight ${
                      i === currentTrackIndex
                        ? 'bg-white text-indigo-900 shadow-sm border-2 border-white scale-105'
                        : 'bg-indigo-500/50 border border-white/10 text-indigo-100 opacity-60'
                    }`}
                  >
                    {track.name}
                  </button>
                ))}
              </div>
              <BeatButton />
            </div>
          )}

          <button
            onClick={onSpin}
            className="mt-6 bg-white/10 hover:bg-white/20 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
          >
            <RefreshCw className="w-3 h-3 inline mr-1" /> Spin another classic
          </button>
        </div>

        {/* Play timer */}
        <div className="mb-6 p-4 bg-indigo-50 rounded-3xl border-2 border-indigo-100">
          <p className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-[0.2em]">Play Time Remaining</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => onAdjustTimer(-30)}
              className="bg-white text-indigo-400 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-indigo-100 active:scale-90 transition-transform font-black"
            >-</button>
            <span className="text-4xl font-black text-indigo-600 font-mono tracking-tighter">
              {formatTime(rewardTimeLeft)}
            </span>
            <button
              onClick={() => onAdjustTimer(30)}
              className="bg-white text-indigo-400 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-indigo-100 active:scale-90 transition-transform font-black"
            >+</button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={onShowStats}
            className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform"
          >Stats</button>
          <button
            onClick={onSleepMode}
            className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-950 active:scale-95 transition-all"
          >
            <Moon className="w-4 h-4 text-white" /> Sleep Mode 🌙
          </button>
        </div>

        {/* Final times */}
        {finalTimes.length > 0 && (
          <div className="w-full space-y-1 opacity-50 pb-2 text-center text-[10px] font-black uppercase text-slate-400">
            {finalTimes.map((t, i) => <p key={i}>{t}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
