/**
 * Audio Service
 *
 * Manages preloading and playback of all SabiSpell WAV sound effects.
 * Uses expo-av's Sound API with a lazy dynamic import so the module loads
 * safely in Expo Go (where ExponentAV native module is absent) and works
 * fully in development builds (npx expo run:android).
 *
 * Call `initAudio()` once on first gameplay screen mount to preload all
 * sounds for low-latency playback. All functions are no-ops when audio is
 * unavailable — the app continues to work silently.
 */

type SoundKey = 'correct' | 'wrong' | 'celebration' | 'gangan';

const soundFiles: Record<SoundKey, ReturnType<typeof require>> = {
  correct:     require('../../assets/audio/streak_pop.wav'),
  wrong:       require('../../assets/audio/wrong_wazobia.wav'),
  celebration: require('../../assets/audio/graduation_fanfare.wav'),
  gangan:      require('../../assets/audio/gangan_correct.wav'),
};

// ── Lazy-loaded Audio reference (null if native module unavailable) ────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AudioAPI: any = null;

async function getAudioAPI(): Promise<any> {
  if (AudioAPI) return AudioAPI;
  try {
    // Dynamic require keeps the import from being evaluated at module load time.
    // If ExponentAV native module is missing (Expo Go), this throws and we
    // return null — all public functions become silent no-ops.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av') as typeof import('expo-av');
    AudioAPI = Audio;
  } catch (e) {
    console.warn('[audio] expo-av native module unavailable (Expo Go). Audio disabled.', e);
    AudioAPI = null;
  }
  return AudioAPI;
}

// ── Sound cache ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const soundCache: Partial<Record<SoundKey, any>> = {};
let audioInitialised = false;

// ── Initialisation ─────────────────────────────────────────────────────────────

/**
 * Preloads all sound effects into memory.
 * Call this on first gameplay screen mount.
 * Safe to call even when expo-av is unavailable.
 */
export async function initAudio(): Promise<void> {
  if (audioInitialised) return;
  audioInitialised = true;
  const Audio = await getAudioAPI();
  if (!Audio) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const keys = Object.keys(soundFiles) as SoundKey[];
    await Promise.all(
      keys.map(async (key) => {
        try {
          const { sound } = await Audio.Sound.createAsync(soundFiles[key], { shouldPlay: false });
          soundCache[key] = sound;
        } catch (e) {
          console.warn(`[audio] preload(${key}) failed:`, e);
        }
      })
    );
  } catch (e) {
    console.warn('[audio] initAudio failed:', e);
  }
}

// ── Playback ──────────────────────────────────────────────────────────────────

async function playSound(key: SoundKey): Promise<void> {
  const Audio = await getAudioAPI();
  if (!Audio) return;
  try {
    let sound = soundCache[key];
    if (!sound) {
      const { sound: loaded } = await Audio.Sound.createAsync(soundFiles[key]);
      soundCache[key] = loaded;
      sound = loaded;
    }
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    console.warn(`[audio] playSound(${key}) failed:`, e);
  }
}

/** Plays streak_pop.wav — correct Academic League answer. */
export function playCorrect(): Promise<void>     { return playSound('correct'); }

/** Plays wrong_wazobia.wav — incorrect answer feedback. */
export function playWrong(): Promise<void>        { return playSound('wrong'); }

/** Plays graduation_fanfare.wav — certificate / graduation celebration. */
export function playCelebration(): Promise<void>  { return playSound('celebration'); }

/** Plays gangan_correct.wav — correct Yoruba answer (Wazobia Mode). */
export function playGangan(): Promise<void>       { return playSound('gangan'); }

// ── Cleanup ───────────────────────────────────────────────────────────────────

/**
 * Unloads all sounds from memory.
 * Call when the user exits the game section.
 */
export async function unloadAudio(): Promise<void> {
  const keys = Object.keys(soundCache) as SoundKey[];
  await Promise.all(
    keys.map(async (key) => {
      try { await soundCache[key]?.unloadAsync(); delete soundCache[key]; } catch (_) {}
    })
  );
  audioInitialised = false;
}
