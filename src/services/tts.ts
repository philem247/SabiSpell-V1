import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';

/**
 * Text-to-Speech & Local Audio Playback Service
 *
 * Wraps expo-speech and expo-audio:
 *  - Checks if a native-recorded Yoruba audio pack file is downloaded.
 *  - Plays high-fidelity native audio if available.
 *  - Falls back to expo-speech with phonetic helper if offline/missing.
 */

const LOCAL_AUDIO_DIR = `${FileSystem.documentDirectory}yoruba_audio/`;

// Keep track of player cache for Yoruba words to ensure smooth, lag-free playback.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localPlayerCache: Record<string, any> = {};

let resolvedEnLocale: string = 'en-NG';
let resolvedYoLocale: string = 'en-NG'; // Updated at runtime

/**
 * Checks if a Yoruba TTS voice is available on this device.
 * Falls back to en-NG if no Yoruba voice is installed.
 */
export async function checkYorubaAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const yoVoice = voices.find(
      (v) => v.language === 'yo' || v.language === 'yo-NG' || v.language?.startsWith('yo')
    );
    if (yoVoice) {
      resolvedYoLocale = yoVoice.language;
      return true;
    }
    resolvedYoLocale = 'en-NG';
    return false;
  } catch {
    resolvedYoLocale = 'en-NG';
    return false;
  }
}

/**
 * Speaks a word or phrase, playing the local downloaded high-fidelity pronunciation if available.
 *
 * @param text     The word or phrase to speak.
 * @param language 'en' for English | 'yo' for Yoruba.
 * @param rate     Speech rate.
 * @param phonetic Optional phonetic transcription fallback.
 * @param wordId   Optional word ID to resolve local downloaded audio.
 */
export async function speak(
  text: string,
  language: 'en' | 'yo' = 'en',
  rate: number = 0.85,
  phonetic?: string,
  wordId?: string
): Promise<void> {
  // Always stop current speech first
  stopSpeaking();

  if (language === 'yo' && wordId) {
    const localUri = `${LOCAL_AUDIO_DIR}${wordId}.mp3`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > 1000) {
        let player = localPlayerCache[wordId];
        if (!player) {
          player = createAudioPlayer(localUri);
          localPlayerCache[wordId] = player;
        }
        player.seekTo(0);
        player.setPlaybackRate(rate);
        player.play();
        return;
      }
    } catch (e) {
      console.warn(`[tts] failed to check or play local audio for ${wordId}:`, e);
    }
  }

  // Fallback to text-to-speech
  const locale = language === 'yo' ? resolvedYoLocale : resolvedEnLocale;
  let textToSpeak = text;
  if (language === 'yo' && (locale === 'en-NG' || locale === 'en' || locale.startsWith('en')) && phonetic) {
    textToSpeak = phonetic;
  }

  Speech.speak(textToSpeak, {
    language: locale,
    rate,
    pitch: 1.0,
    onError: () => {
      Speech.speak(textToSpeak, { language: 'en', rate });
    },
  });
}

/**
 * Speaks a word slowly.
 */
export function speakSlowly(
  text: string,
  language: 'en' | 'yo' = 'en',
  phonetic?: string,
  wordId?: string
): void {
  speak(text, language, 0.6, phonetic, wordId);
}

/**
 * Stops any currently playing speech.
 */
export function stopSpeaking(): void {
  Speech.stop();
  Object.values(localPlayerCache).forEach((player) => {
    try {
      player.pause();
    } catch (_) {}
  });
}

/**
 * Returns whether TTS is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  const isAnyLocalPlaying = Object.values(localPlayerCache).some((player) => player.playing);
  if (isAnyLocalPlaying) {
    return true;
  }
  return Speech.isSpeakingAsync();
}

