import { createAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bgmPlayer: any = null;
let bgmEnabled = false;
let isInitialized = false;

// Web autoplay policy: play() may reject before a user gesture; retry on first tap.
function tryPlay(): void {
  try {
    const r = bgmPlayer?.play();
    if (r && typeof r.catch === 'function') r.catch(armGesture);
  } catch {
    armGesture();
  }
}

let gestureArmed = false;
function armGesture(): void {
  if (gestureArmed || typeof document === 'undefined') return;
  gestureArmed = true;
  const once = () => {
    document.removeEventListener('pointerdown', once);
    gestureArmed = false;
    if (bgmEnabled) tryPlay();
  };
  document.addEventListener('pointerdown', once);
}

/**
 * Initializes the Background Music player and reads the user's preference from storage.
 */
export async function initBGM(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const stored = await AsyncStorage.getItem('sabispell:bgm_enabled');
    // Default BGM to enabled (true) if never configured
    bgmEnabled = stored !== 'false';
    
    // Create the player referencing the suno-generated talking drum loop
    bgmPlayer = createAudioPlayer(require('../../assets/audio/bg_music.mp3'));
    bgmPlayer.loop = true;
    bgmPlayer.volume = 0.22; // Keep background music soft and non-intrusive
    
    if (bgmEnabled) {
      tryPlay();
    }
  } catch (e) {
    console.warn('[bgm] failed to initialize BGM player:', e);
  }
}

/**
 * Toggles the background music state, updates preferences, and plays/pauses.
 */
export async function toggleBGM(): Promise<boolean> {
  bgmEnabled = !bgmEnabled;
  try {
    await AsyncStorage.setItem('sabispell:bgm_enabled', String(bgmEnabled));
    if (bgmPlayer) {
      if (bgmEnabled) {
        tryPlay();
      } else {
        bgmPlayer.pause();
      }
    }
  } catch (e) {
    console.warn('[bgm] failed to save BGM preference:', e);
  }
  return bgmEnabled;
}

/**
 * Returns whether BGM is currently enabled in user preferences.
 */
export function isBGMEnabled(): boolean {
  return bgmEnabled;
}

/**
 * Temporarily pauses BGM playback (e.g., when screen blurs or is placed in background).
 */
export function pauseBGM(): void {
  if (bgmPlayer && bgmEnabled) {
    try {
      bgmPlayer.pause();
    } catch (_) {}
  }
}

/**
 * Resumes BGM playback if it's enabled (e.g., when screen regains focus).
 */
export function resumeBGM(): void {
  if (bgmPlayer && bgmEnabled) {
    tryPlay();
  }
}
