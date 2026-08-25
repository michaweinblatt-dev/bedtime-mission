import { useState, useMemo } from 'react';
import SpinWheel from './SpinWheel';
import { track } from '../utils/analytics';

// The Captain spins for tonight's/today's reward game: one spin, then one
// optional re-spin. Whatever the second spin lands on (if used) is final.
export default function GameWheelModal({ captainType, pool, onDone }) {
  const segments = useMemo(() => {
    const seen = new Set();
    return pool
      .filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)))
      .map(r => ({ id: r.id, label: r.title }));
  }, [pool]);

  const [targetId, setTargetId] = useState(null);
  const [spinToken, setSpinToken] = useState(0);
  const [settled, setSettled] = useState(false);
  const [respinUsed, setRespinUsed] = useState(false);

  const landedReward = targetId ? pool.find(r => r.id === targetId) : null;

  const spin = () => {
    const reward = pool[Math.floor(Math.random() * pool.length)];
    setTargetId(reward.id);
    setSettled(false);
    setSpinToken(t => t + 1);
  };

  const handleRespin = () => {
    track('respin_used', { captain_type: captainType, game_shown: landedReward?.title });
    setRespinUsed(true);
    spin();
  };

  const handleSettled = () => {
    setSettled(true);
    const reward = pool.find(r => r.id === targetId);
    track('game_wheel_spun', { captain_type: captainType, game_shown: reward?.title, is_respin: respinUsed });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-6">
      <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">Captain's Spin</p>
        <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-tight mb-6">Tonight's Game</h2>

        <div className="flex justify-center mb-6">
          <SpinWheel segments={segments} targetId={targetId} spinToken={spinToken} onSettled={handleSettled} />
        </div>

        {settled ? (
          <>
            <p className="text-xl font-black text-indigo-600 mb-2 uppercase">{landedReward?.title}</p>
            <p className="text-sm text-slate-500 mb-6">{landedReward?.desc}</p>
            <div className="flex gap-2">
              {!respinUsed && (
                <button
                  onClick={handleRespin}
                  className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Spin Again
                </button>
              )}
              <button
                onClick={() => onDone(landedReward)}
                className={`${respinUsed ? 'w-full' : 'flex-[2]'} bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-lg`}
              >
                Let's Do It!
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={spin}
            disabled={spinToken > 0}
            className="w-full bg-pink-500 hover:bg-pink-400 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg disabled:opacity-50"
          >
            Spin!
          </button>
        )}
      </div>
    </div>
  );
}
