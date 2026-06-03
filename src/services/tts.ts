import * as Speech from 'expo-speech';

/**
 * Text-to-Speech Service
 *
 * Wraps expo-speech with:
 *  - en-NG locale preference (falls back to 'en' if unavailable)
 *  - Yoruba locale check (yo-NG → yo → en-NG fallback)
 *  - Safe stop guard (checks isSpeaking before stopping)
 */

// Resolve the best available English locale on this device.
// expo-speech uses the device's installed TTS engine — en-NG is
// available on most modern Android devices, but we fall back gracefully.
let resolvedEnLocale: string = 'en-NG';
let resolvedYoLocale: string = 'en-NG'; // Updated at runtime by checkYorubaAvailable()

/**
 * Checks if a Yoruba TTS voice is available on this device.
 * Should be called once at app start (e.g. in _layout.tsx or on Wazobia mode load).
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
    // Fallback: use en-NG for Yoruba words (better than silence)
    resolvedYoLocale = 'en-NG';
    return false;
  } catch {
    resolvedYoLocale = 'en-NG';
    return false;
  }
}

/**
 * Speaks a word or phrase using TTS.
 *
 * @param text     The word or phrase to speak.
 * @param language 'en' for English (Academic League) | 'yo' for Yoruba (Wazobia Mode).
 * @param rate     Speech rate — defaults to 0.85 (slightly slower than normal for learning clarity).
 * @param phonetic Optional phonetic transcription for Yoruba words when native Yoruba TTS is unavailable.
 */
export function speak(
  text: string,
  language: 'en' | 'yo' = 'en',
  rate: number = 0.85,
  phonetic?: string
): void {
  const locale = language === 'yo' ? resolvedYoLocale : resolvedEnLocale;

  let textToSpeak = text;
  // If we are speaking Yoruba, and no native Yoruba TTS voice is available on this device
  // (locale is en-NG or standard English), use the phonetic pronunciation string instead.
  if (language === 'yo' && (locale === 'en-NG' || locale === 'en' || locale.startsWith('en')) && phonetic) {
    textToSpeak = phonetic;
  }

  // Stop any current speech before starting a new one
  Speech.stop();

  Speech.speak(textToSpeak, {
    language: locale,
    rate,
    pitch: 1.0,
    onError: () => {
      // Fallback: try speaking with default locale if preferred locale fails
      Speech.speak(textToSpeak, { language: 'en', rate });
    },
  });
}

/**
 * Speaks a word slowly — used for the "hear it again" button in gameplay HUD.
 */
export function speakSlowly(text: string, language: 'en' | 'yo' = 'en', phonetic?: string): void {
  speak(text, language, 0.6, phonetic);
}

/**
 * Stops any currently playing TTS speech.
 */
export function stopSpeaking(): void {
  Speech.stop();
}

/**
 * Returns whether TTS is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
