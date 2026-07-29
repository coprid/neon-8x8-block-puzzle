import { useRef, useCallback, useEffect } from 'react';

export function useAudio(muted: boolean) {
  const audioCtx = useRef<AudioContext | null>(null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // ── AudioContext helper ──
  const getAudio = useCallback((): AudioContext | null => {
    if (mutedRef.current) return null;
    if (!audioCtx.current) {
      try {
        audioCtx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    // FIX Safari/iOS: AudioContext starts suspended until user interaction
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume().catch(() => {});
    }
    return audioCtx.current;
  }, []);

  // ── Tone helper ──
  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.18, delay = 0) => {
    const ctx = getAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch { /* silent */ }
  }, [getAudio]);

  // ── Sound effects ──
  const playPlace = useCallback(() => {
    playTone(280, 'sine', 0.1, 0.15);
    playTone(380, 'sine', 0.07, 0.1, 0.05);
  }, [playTone]);

  const playClear = useCallback((lines: number) => {
    const base = lines >= 3 ? 660 : lines === 2 ? 550 : 440;
    playTone(base, 'sine', 0.25, 0.25);
    playTone(base * 1.5, 'sine', 0.2, 0.2, 0.1);
    if (lines >= 2) playTone(base * 2, 'sine', 0.18, 0.18, 0.2);
    if (lines >= 3) playTone(base * 2.5, 'triangle', 0.15, 0.15, 0.3);
  }, [playTone]);

  const playGameOver = useCallback(() => {
    playTone(220, 'sawtooth', 0.3, 0.2);
    playTone(165, 'sawtooth', 0.3, 0.2, 0.2);
    playTone(110, 'sawtooth', 0.4, 0.2, 0.4);
  }, [playTone]);

  return { playPlace, playClear, playGameOver };
}