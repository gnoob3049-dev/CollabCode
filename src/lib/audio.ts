/**
 * Audio notification utility for CollabCode.
 * Uses the Web Audio API to generate short, pleasant notification sounds
 * programmatically — no external audio files required.
 */

export type SoundType =
  | 'message'
  | 'success'
  | 'error'
  | 'join'
  | 'leave'
  | 'save'
  | 'run_start'
  | 'run_complete';

const STORAGE_KEY = 'collabcode-audio-enabled';

// Lazily initialised AudioContext (browsers require user interaction first)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (happens after page idle)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ---------------------------------------------------------------------------
// Sound definitions
// ---------------------------------------------------------------------------

interface ToneDef {
  frequency: number;
  duration: number;   // ms
  type: OscillatorType;
  gainStart: number;
  gainEnd: number;
  delay?: number;     // ms before this tone starts (relative to play call)
}

const SOUND_DEFS: Record<SoundType, ToneDef[]> = {
  message: [
    { frequency: 800, duration: 100, type: 'sine', gainStart: 0.15, gainEnd: 0.15, delay: 0 },
    { frequency: 1200, duration: 100, type: 'sine', gainStart: 0.15, gainEnd: 0.15, delay: 100 },
  ],
  success: [
    { frequency: 523, duration: 80, type: 'sine', gainStart: 0.12, gainEnd: 0.12, delay: 0 },
    { frequency: 659, duration: 80, type: 'sine', gainStart: 0.12, gainEnd: 0.12, delay: 80 },
    { frequency: 784, duration: 120, type: 'sine', gainStart: 0.12, gainEnd: 0, delay: 160 },
  ],
  error: [
    { frequency: 300, duration: 200, type: 'sawtooth', gainStart: 0.08, gainEnd: 0, delay: 0 },
  ],
  join: [
    { frequency: 880, duration: 200, type: 'sine', gainStart: 0, gainEnd: 0, delay: 0 },
  ],
  leave: [
    { frequency: 600, duration: 200, type: 'sine', gainStart: 0.1, gainEnd: 0, delay: 0 },
  ],
  save: [
    { frequency: 1000, duration: 50, type: 'sine', gainStart: 0.12, gainEnd: 0.12, delay: 0 },
  ],
  run_start: [
    // Noise-burst click — simulated with a very short high-freq square wave
    { frequency: 2200, duration: 30, type: 'square', gainStart: 0.06, gainEnd: 0, delay: 0 },
    { frequency: 1800, duration: 30, type: 'square', gainStart: 0.04, gainEnd: 0, delay: 15 },
  ],
  run_complete: [
    { frequency: 523, duration: 80, type: 'sine', gainStart: 0.12, gainEnd: 0.12, delay: 0 },
    { frequency: 659, duration: 80, type: 'sine', gainStart: 0.12, gainEnd: 0.12, delay: 80 },
    { frequency: 784, duration: 120, type: 'sine', gainStart: 0.12, gainEnd: 0, delay: 160 },
  ],
};

// ---------------------------------------------------------------------------
// Special handling for descending tones (error, leave) — frequency ramp
// ---------------------------------------------------------------------------

function playTone(def: ToneDef, ctx: AudioContext, startTime: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = def.type;
  osc.frequency.setValueAtTime(def.frequency, startTime);

  // For descending tones, ramp frequency down over the duration
  if (
    (def.type === 'sawtooth' && def.frequency === 300) || // error sound
    (def.type === 'sine' && def.frequency === 600)        // leave sound
  ) {
    osc.frequency.linearRampToValueAtTime(
      def.frequency * 0.67, // ~200 for error, ~400 for leave
      startTime + def.duration / 1000
    );
  }

  // Gain envelope
  gain.gain.setValueAtTime(def.gainStart, startTime);
  gain.gain.linearRampToValueAtTime(def.gainEnd, startTime + def.duration / 1000);

  // For join sound, add a gentle attack envelope
  if (def.frequency === 880 && def.type === 'sine' && def.gainStart === 0) {
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + def.duration / 1000);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime + (def.delay ?? 0) / 1000);
  osc.stop(startTime + (def.delay ?? 0) / 1000 + def.duration / 1000 + 0.01);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Play a notification sound.
 * No-ops when audio is disabled or in non-browser environments.
 */
export function playSound(type: SoundType, options?: { hasErrors?: boolean }): void {
  if (typeof window === 'undefined') return;
  if (!isAudioEnabled()) return;

  // run_complete delegates to success or error
  const effectiveType = type === 'run_complete'
    ? (options?.hasErrors ? 'error' : 'success')
    : type;

  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const tones = SOUND_DEFS[effectiveType] ?? SOUND_DEFS.success;

  for (const tone of tones) {
    playTone(tone, ctx, now);
  }
}

/**
 * Check whether audio notifications are enabled.
 */
export function isAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  // Default to enabled if never set
  return stored === null ? true : stored === 'true';
}

/**
 * Enable or disable audio notifications.
 */
export function setAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

/**
 * Toggle audio notifications and return the new state.
 */
export function toggleAudio(): boolean {
  const next = !isAudioEnabled();
  setAudioEnabled(next);
  return next;
}