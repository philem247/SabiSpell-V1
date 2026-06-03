/**
 * Audio Service
 *
 * Manages preloading and playback of all SabiSpell WAV sound effects.
 * Uses expo-audio's imperative API for low-latency playback.
 *
 * Call `initAudio()` once on first gameplay screen mount to preload all
 * sounds for low-latency playback.
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

type SoundKey = 'correct' | 'wrong' | 'celebration' | 'gangan';

const soundFiles: Record<SoundKey, ReturnType<typeof require>> = {
  correct:     require('../../assets/audio/streak_pop.mp3'),
  wrong:       require('../../assets/audio/wrong_wazobia.mp3'),
  celebration: require('../../assets/audio/graduation_fanfare.mp3'),
  gangan:      require('../../assets/audio/gangan_correct.mp3'),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const playerCache: Partial<Record<SoundKey, any>> = {};
let audioInitialised = false;

/**
 * Preloads all sound effects into memory.
 * Call this on first gameplay screen mount.
 */
export async function initAudio(): Promise<void> {
  if (audioInitialised) return;
  audioInitialised = true;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });
  } catch (e) {
    console.warn('[audio] setAudioModeAsync failed:', e);
  }
  
  const keys = Object.keys(soundFiles) as SoundKey[];
  keys.forEach((key) => {
    try {
      playerCache[key] = createAudioPlayer(soundFiles[key] as any);
    } catch (e) {
      console.warn(`[audio] preload(${key}) failed:`, e);
    }
  });
}

const durationLimits: Record<SoundKey, number> = {
  correct: 1200,      // 1.2s for correct pop/chime
  wrong: 1200,        // 1.2s for incorrect buzz
  celebration: 6000,  // 6s for fanfare
  gangan: 3000,       // 3s for talk drum roll
};

const playTimeouts: Partial<Record<SoundKey, ReturnType<typeof setTimeout>>> = {};

/**
 * Helper to seek to start and play a sound.
 */
async function playSound(key: SoundKey): Promise<void> {
  try {
    let player = playerCache[key];
    if (!player) {
      player = createAudioPlayer(soundFiles[key] as any);
      playerCache[key] = player;
    }

    if (playTimeouts[key]) {
      clearTimeout(playTimeouts[key]);
      delete playTimeouts[key];
    }

    // Seek back to start so it can be replayed instantly
    player.seekTo(0);
    player.play();

    const limit = durationLimits[key];
    playTimeouts[key] = setTimeout(() => {
      try {
        player.pause();
        player.seekTo(0);
      } catch (_) {}
    }, limit);
  } catch (e) {
    console.warn(`[audio] playSound(${key}) failed:`, e);
  }
}

/** Plays streak_pop.mp3 — correct Academic League answer. */
export function playCorrect(): Promise<void>     { return playSound('correct'); }

/** Plays wrong_wazobia.mp3 — incorrect answer feedback. */
export function playWrong(): Promise<void>        { return playSound('wrong'); }

/** Plays graduation_fanfare.mp3 — certificate / graduation celebration. */
export function playCelebration(): Promise<void>  { return playSound('celebration'); }

/** Plays gangan_correct.mp3 — correct Yoruba answer (Wazobia Mode). */
export function playGangan(): Promise<void>       { return playSound('gangan'); }

/**
 * Unloads all sounds from memory.
 * Call when the user exits the game section.
 */
export async function unloadAudio(): Promise<void> {
  const keys = Object.keys(playerCache) as SoundKey[];
  keys.forEach((key) => {
    try {
      if (playTimeouts[key]) {
        clearTimeout(playTimeouts[key]);
        delete playTimeouts[key];
      }
      playerCache[key]?.release();
      delete playerCache[key];
    } catch (_) {}
  });
  audioInitialised = false;
}

