import { useEffect, useRef, useState } from 'react';

const HEX_COLORS = ['#f472b6', '#818cf8', '#c084fc', '#22d3ee', '#fbbf24', '#34d399', '#fb7185', '#60a5fa', '#a78bfa', '#4ade80'];
const SPIN_DURATION_MS = 3200;

// Exposed so callers can render a color swatch next to the settled result
// text that matches the wedge under the pointer — a color match is far
// easier to visually confirm at a glance than reading small rotated text.
export function colorForSegment(index) {
  return HEX_COLORS[index % HEX_COLORS.length];
}

// Presentational-only spinning wheel. The result is decided by the caller
// (fairness bag or weighted random pick) BEFORE the animation starts —
// this component just spins to land visually on `targetId`.
export default function SpinWheel({ segments, targetId, spinToken, onSettled, size = 260 }) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const prevSpinToken = useRef(spinToken);
  const onSettledRef = useRef(onSettled);
  const settledTokenRef = useRef(null);
  onSettledRef.current = onSettled;

  const n = segments.length;
  const segAngle = n > 0 ? 360 / n : 360;

  useEffect(() => {
    if (spinToken == null || spinToken === prevSpinToken.current) return;
    prevSpinToken.current = spinToken;

    const targetIdx = Math.max(0, segments.findIndex(s => s.id === targetId));
    const centerAngle = targetIdx * segAngle + segAngle / 2;
    const jitter = (Math.random() - 0.5) * (segAngle * 0.5);
    const wantedMod = (((360 - (centerAngle + jitter)) % 360) + 360) % 360;
    const currentMod = ((rotationRef.current % 360) + 360) % 360;
    const delta = ((wantedMod - currentMod) % 360 + 360) % 360;
    const extraSpins = 4;

    const next = rotationRef.current + extraSpins * 360 + delta;
    rotationRef.current = next;
    setRotation(next);

    // Timer-based fallback settle: a backgrounded/unfocused tab can throttle
    // or drop the CSS transitionend event, so don't rely on it alone.
    const token = spinToken;
    const timer = setTimeout(() => {
      if (settledTokenRef.current !== token) {
        settledTokenRef.current = token;
        onSettledRef.current?.();
      }
    }, SPIN_DURATION_MS + 150);
    return () => clearTimeout(timer);
  }, [spinToken, targetId, segments, segAngle]);

  const handleTransitionEnd = () => {
    if (settledTokenRef.current !== spinToken) {
      settledTokenRef.current = spinToken;
      onSettledRef.current?.();
    }
  };

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <div
        className="absolute left-1/2 -top-3 -translate-x-1/2 z-10 w-0 h-0"
        style={{
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '22px solid #f472b6',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
        }}
      />
      <div
        className="w-full h-full rounded-full border-[6px] border-white/40 shadow-2xl relative overflow-hidden"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 3.2s cubic-bezier(0.12, 0.67, 0.1, 1)',
          background: n > 0
            ? `conic-gradient(${segments.map((s, i) => `${HEX_COLORS[i % HEX_COLORS.length]} ${i * segAngle}deg ${(i + 1) * segAngle}deg`).join(', ')})`
            : '#818cf8',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {segments.map((s, i) => {
          const mid = i * segAngle + segAngle / 2;
          // Unrotated, translateX points along the local +x axis, which is
          // screen-right (i.e. angle 90° in our "clockwise from top" wedge
          // convention) — so the rotation needed to aim it at `mid` is
          // `mid - 90`, not `mid` itself.
          return (
            <div
              key={s.id}
              className="absolute top-1/2 left-1/2 h-0 origin-left"
              style={{ transform: `rotate(${mid - 90}deg) translateX(45px)`, width: size / 2 - 55 }}
            >
              <span className="block -translate-y-1/2 text-white font-black text-[10px] uppercase tracking-tight drop-shadow-md truncate">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border-4 border-indigo-200" />
    </div>
  );
}
