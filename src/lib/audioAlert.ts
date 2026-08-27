/**
 * Web Audio API synthesizer for playing anti-cheat warning beep and siren sounds.
 * Does not rely on external MP3 assets, works on all mobile & desktop browsers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playAntiCheatAlertSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First alarm beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second urgent beep pulse
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, now + 0.35);
    osc2.frequency.setValueAtTime(1600, now + 0.5);

    gain2.gain.setValueAtTime(0.45, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.35);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Unable to play audio alert sound:', err);
  }
}

/**
 * Loud dual-tone security siren for serious cheating attempts (Split Screen, Dual App, Exit Fullscreen)
 */
export function playAntiCheatSirenSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Modulate frequency up and down like a real siren
    for (let i = 0; i < 4; i++) {
      const step = now + i * 0.3;
      osc.frequency.setValueAtTime(700, step);
      osc.frequency.linearRampToValueAtTime(1400, step + 0.15);
      osc.frequency.linearRampToValueAtTime(700, step + 0.3);
    }

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.warn('Unable to play siren sound:', err);
  }
}

