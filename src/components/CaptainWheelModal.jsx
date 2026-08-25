import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import SpinWheel, { colorForSegment } from './SpinWheel';
import { useCaptainBag } from '../hooks/useCaptainBag';
import { CAPTAIN_BAG_KEYS } from '../utils/constants';
import { track } from '../utils/analytics';

const TITLES = {
  bedtime: 'Bedtime Captain',
  morning: 'Morning Captain',
};

export default function CaptainWheelModal({ captainType, roster, onDone, onClose }) {
  const eligible = useMemo(() => roster.filter(k => k.includeTonight), [roster]);
  const { spin } = useCaptainBag(CAPTAIN_BAG_KEYS[captainType]);
  const [targetId, setTargetId] = useState(null);
  const [spinToken, setSpinToken] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    track('captain_wheel_opened', { captain_type: captainType });
  }, [captainType]);

  // Memoized on `eligible` (itself stable unless the roster changes) so the
  // SpinWheel's landing-animation effect doesn't get torn down and restarted
  // by unrelated parent re-renders (e.g. the app's once-a-second timer tick).
  const segments = useMemo(() => eligible.map(k => ({ id: k.id, label: k.name })), [eligible]);
  const landedName = targetId ? eligible.find(k => k.id === targetId)?.name : null;
  const landedIdx = targetId ? segments.findIndex(s => s.id === targetId) : -1;

  const handleSpin = () => {
    const captainId = spin(eligible.map(k => k.id));
    setTargetId(captainId);
    setSpinToken(t => t + 1);
  };

  const handleSettled = () => {
    setSettled(true);
    track('captain_wheel_spun', { captain_type: captainType, captain_name: landedName });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-6">
      <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative">
        {!settled && (
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        )}

        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">Spinning for</p>
        <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-tight mb-6">{TITLES[captainType]}</h2>

        <div className="flex justify-center mb-6">
          <SpinWheel segments={segments} targetId={targetId} spinToken={spinToken} onSettled={handleSettled} />
        </div>

        {settled ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-6">
              {landedIdx >= 0 && (
                <span
                  className="w-4 h-4 rounded-full border-2 border-white shadow shrink-0"
                  style={{ backgroundColor: colorForSegment(landedIdx) }}
                  aria-hidden="true"
                />
              )}
              <p className="text-3xl font-black text-indigo-600">{landedName} 👑</p>
            </div>
            <button
              onClick={() => onDone(targetId)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg"
            >
              Let's Go!
            </button>
          </>
        ) : (
          <button
            onClick={handleSpin}
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
