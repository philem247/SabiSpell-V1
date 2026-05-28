import { Audio } from 'expo-av';

/**
 * Audio Service
 *
 * Manages preloading and playback of all SabiSpell WAV sound effects.
 * Uses expo-av's Sound API. Each sound is loaded once and reused.
 *
 * Call `initAudio()` once on first gameplay screen mount to preload all
 * sounds for low-latency playback.
 */

type SoundKey = 'correct' | 'wrong' | 'celebration' | 'gangan';

const soundFiles: Record<SoundKey, ReturnType<typeof require>> = {
  correct:     require('../../assets/audio/streak_pop.wav'),
  wrong:       require('../../assets/audio/wrong_wazobia.wav'),
  celebration: require('../../assets/audio/graduation_fanfare.wav'),
  gangan:      require('../../assets/audio/gangan_correct.wav'),
};

// Cache of loaded Sound objects
const soundCache: Partial<Record<SoundKey, Audio.Sound>> = {};
let audioInitialised = false;

async function setAudioMode() {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
}

/**
 * Preloads all sound effects into memory.
 * Call this on first gameplay screen mount.
 */
export async function initAudio(): Promise<void> {
  if (audioInitialised) return;
  audioInitialised = true;
  try {
    await setAudioMode();
    const keys = Object.keys(soundFiles) as SoundKey[];
    await Promise.all(
      keys.map(async (key) => {
        const { sound } = await Audio.Sound.createAsync(soundFiles[key], { shouldPlay: false });
        soundCache[key] = sound;
      })
    );
  } catch (e) {
    console.warn('[audio] initAudio failed:', e);
  }
}

/**
 * Plays a preloaded sound by key. Loads on demand if not yet initialised.
 */
async function playSound(key: SoundKey): Promise<void> {
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
export function playCorrect(): Promise<void> { return playSound('correct'); }

/** Plays wrong_wazobia.wav — incorrect answer feedback. */
export function playWrong(): Promise<void>   { return playSound('wrong'); }

/** Plays graduation_fanfare.wav — certificate / graduation celebration. */
export function playCelebration(): Promise<void> { return playSound('celebration'); }

/** Plays gangan_correct.wav — correct Yoruba answer (Wazobia Mode). */
export function playGangan(): Promise<void>  { return playSound('gangan'); }

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
