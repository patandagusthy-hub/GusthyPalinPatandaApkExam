/**
 * Web Audio API synthesizer for playing anti-cheat warning beep sounds.
 * Does not rely on external MP3 assets.
 */

let audioCtx: AudioContext | null = null;

export function playAntiCheatAlertSound(): void {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // First alarm beep
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second urgent beep pulse
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, now + 0.35);
    osc2.frequency.setValueAtTime(1500, now + 0.5);

    gain2.gain.setValueAtTime(0.4, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc2.start(now + 0.35);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Unable to play audio alert sound:', err);
  }
}
