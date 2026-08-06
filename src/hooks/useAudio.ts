import { useRef, useCallback, useEffect } from 'react';

export function useAudio(muted: boolean, volume = 1) {
  const audioCtx = useRef<AudioContext | null>(null);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

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
    const v = vol * volumeRef.current;
    if (v <= 0) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(v, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch { /* silent */ }
  }, [getAudio]);

  // ── Shaped note: smooth attack + optional lowpass (no click at start) ──
  const playNote = useCallback((opts: {
    freq: number;
    type: OscillatorType;
    duration: number;
    vol?: number;
    delay?: number;
    attack?: number;
    filterFreq?: number;
    freqEnd?: number;
  }) => {
    const ctx = getAudio();
    if (!ctx) return;
    const v = (opts.vol ?? 0.18) * volumeRef.current;
    if (v <= 0) return;
    try {
      const t0 = ctx.currentTime + (opts.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type;
      osc.frequency.setValueAtTime(opts.freq, t0);
      if (opts.freqEnd) {
        osc.frequency.linearRampToValueAtTime(opts.freqEnd, t0 + opts.duration);
      }
      // Старт строго с нуля и плавный подъём — иначе щелчок
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(v, t0 + (opts.attack ?? 0.005));
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + opts.duration);
      if (opts.filterFreq) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(opts.filterFreq, t0);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + opts.duration);
    } catch { /* silent */ }
  }, [getAudio]);

  // ── Sound effects ──
  const playPlace = useCallback(() => {
    playTone(280, 'sine', 0.1, 0.15);
    playTone(380, 'sine', 0.07, 0.1, 0.05);
  }, [playTone]);

    const playClear = useCallback((lines: number) => {
    const freqs = [523.25, 659.25, 783.99];
    if (lines >= 2) freqs.push(1046.5);
    if (lines >= 3) freqs.push(1318.51);
    freqs.forEach((freq, i) => {
      playNote({ freq, type: 'sine', duration: 0.4, vol: 0.08, delay: i * 0.03, attack: 0.005 });
    });
  }, [playNote]);

  const playGameOver = useCallback(() => {
    playNote({ freq: 220, freqEnd: 180, type: 'sawtooth', duration: 0.35, vol: 0.14, filterFreq: 300, attack: 0.01 });
    playNote({ freq: 165, freqEnd: 135, type: 'sawtooth', duration: 0.35, vol: 0.14, delay: 0.22, filterFreq: 300, attack: 0.01 });
    playNote({ freq: 110, freqEnd: 78, type: 'sawtooth', duration: 0.5, vol: 0.14, delay: 0.44, filterFreq: 300, attack: 0.01 });
  }, [playNote]);

  return { playPlace, playClear, playGameOver };
}