import { useRef, useCallback } from 'react';

export function useAudio() {
  const ctxRef = useRef(null);
  const lullabyIntervalRef = useRef(null);

  const unlockAudio = useCallback(async () => {
    if (ctxRef.current?.state === 'suspended') {
      await ctxRef.current.resume();
    }
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();
    }
  }, []);

  const playRocketSound = useCallback((done, total) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const b = 150 + (done / total) * 400;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(b, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(b * 2.5, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  }, []);

  const playSuccessSound = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    [440, 554, 659, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1 + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.1);
      o.stop(ctx.currentTime + 1.5);
    });
  }, []);

  const playLullaby = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    let step = 0;
    if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);
    lullabyIntervalRef.current = setInterval(() => {
      const time = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime([329.63, 392.00, 440.00, 523.25][step % 4], time);
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.05, time + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, time + 2);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(time + 2);
      step++;
    }, 1500);
  }, []);

  const stopLullaby = useCallback(() => {
    if (lullabyIntervalRef.current) {
      clearInterval(lullabyIntervalRef.current);
      lullabyIntervalRef.current = null;
    }
  }, []);

  const playCameraSound = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(200, ctx.currentTime);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.1);
  }, []);

  return { unlockAudio, playRocketSound, playSuccessSound, playLullaby, stopLullaby, playCameraSound };
}
