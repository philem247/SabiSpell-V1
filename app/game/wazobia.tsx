import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { yorubaAssets } from '../../src/services/yorubaAssets';
import { useProfileStore } from '../../src/store/profileStore';
import { useGameStore } from '../../src/store/gameStore';
import { getNextWord, Word, maskWordInSentence, getProverbForWord, Proverb, loadWordBank } from '../../src/services/wordbank';
import { calculateSSRDelta } from '../../src/services/ssr';
import { calculateReward } from '../../src/services/economy';
import { speak, stopSpeaking } from '../../src/services/tts';
import { initAudio, playWrong, playGangan } from '../../src/services/audio';
import { pauseBGM, resumeBGM } from '../../src/services/bgm';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Spacing, Shadows } from '../../src/constants/Colors';
import { AppConfig } from '../../src/constants/AppConfig';
import AjalaAvatar, { AjalaState } from '../../src/components/AjalaAvatar';
import AnkaraTile from '../../src/components/AnkaraTile';

const WORDS_PER_ROUND = AppConfig.WORDS_PER_ROUND;
const TIME_PER_WORD   = AppConfig.TIME_PER_WORD_SEC;

type AnswerStatus = 'idle' | 'correct' | 'wrong' | 'timeout';

// ── Custom Yoruba Keyboard Constants & Helpers ──────────────────────────────
const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 380;
const isDesktop = Platform.OS === 'web' && screenWidth > 768;

const KEYBOARD_WIDTH = isDesktop ? 600 : screenWidth;
const KEY_MARGIN = isSmallDevice ? 2 : 4;
const KEY_HEIGHT = isSmallDevice ? 44 : 50;

// 10 columns for standard keyboard rows
const KEY_COLUMNS = 10;
const KEY_WIDTH = (KEYBOARD_WIDTH - 20 - (KEY_COLUMNS * KEY_MARGIN * 2)) / KEY_COLUMNS;

// 6 columns for the Yoruba accent bar
const ACCENT_COLUMNS = 6;
const ACCENT_KEY_WIDTH = (KEYBOARD_WIDTH - 20 - (ACCENT_COLUMNS * KEY_MARGIN * 2)) / ACCENT_COLUMNS;

// Precomposed Yoruba Vowels with Tones
const toneMap: Record<string, { plain: string; acute: string; grave: string }> = {
  'A': { plain: 'A', acute: 'Á', grave: 'À' },
  'Á': { plain: 'A', acute: 'Á', grave: 'À' },
  'À': { plain: 'A', acute: 'Á', grave: 'À' },

  'E': { plain: 'E', acute: 'É', grave: 'È' },
  'É': { plain: 'E', acute: 'É', grave: 'È' },
  'È': { plain: 'E', acute: 'É', grave: 'È' },

  'Ẹ': { plain: 'Ẹ', acute: 'Ẹ́', grave: 'Ẹ̀' },
  'Ẹ́': { plain: 'Ẹ', acute: 'Ẹ́', grave: 'Ẹ̀' },
  'Ẹ̀': { plain: 'Ẹ', acute: 'Ẹ́', grave: 'Ẹ̀' },

  'I': { plain: 'I', acute: 'Í', grave: 'Ì' },
  'Í': { plain: 'I', acute: 'Í', grave: 'Ì' },
  'Ì': { plain: 'I', acute: 'Í', grave: 'Ì' },

  'O': { plain: 'O', acute: 'Ó', grave: 'Ò' },
  'Ó': { plain: 'O', acute: 'Ó', grave: 'Ò' },
  'Ò': { plain: 'O', acute: 'Ó', grave: 'Ò' },

  'Ọ': { plain: 'Ọ', acute: 'Ọ́', grave: 'Ọ̀' },
  'Ọ́': { plain: 'Ọ', acute: 'Ọ́', grave: 'Ọ̀' },
  'Ọ̀': { plain: 'Ọ', acute: 'Ọ́', grave: 'Ọ̀' },

  'U': { plain: 'U', acute: 'Ú', grave: 'Ù' },
  'Ú': { plain: 'U', acute: 'Ú', grave: 'Ù' },
  'Ù': { plain: 'U', acute: 'Ú', grave: 'Ù' },
};

const handleTonePress = (prevInput: string, tone: 'acute' | 'grave'): string => {
  if (prevInput.length === 0) return prevInput;
  const lastChar = prevInput[prevInput.length - 1];
  const rest = prevInput.slice(0, -1);
  const upperLast = lastChar.toUpperCase();

  const entry = toneMap[upperLast];
  if (!entry) return prevInput; // Not toneable

  let newChar = upperLast;
  if (tone === 'acute') {
    newChar = upperLast === entry.acute ? entry.plain : entry.acute;
  } else {
    newChar = upperLast === entry.grave ? entry.plain : entry.grave;
  }

  const isLower = lastChar === lastChar.toLowerCase();
  const finalChar = isLower ? newChar.toLowerCase() : newChar;
  return rest + finalChar;
};

// SVG Icons
const DeleteIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 4H8L1.5 12L8 20H21C22.1 20 23 19.1 23 18V6C23 4.9 22.1 4 21 4ZM19 15L17.6 16.4L14.5 13.3L11.4 16.4L10 15L13.1 11.9L10 8.8L11.4 7.4L14.5 10.5L17.6 7.4L19 8.8L15.9 11.9L19 15Z"
      fill={color}
    />
  </Svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z"
      fill={color}
    />
  </Svg>
);

export default function WazobiaGameScreen() {
  const router = useRouter();
  const theme  = Themes.wazobia;
  const insets = useSafeAreaInsets();

  // ── Global Profile & Game Stores ──────────────────────────────────────────
  const {
    wazobia_ssr, coins, daily_streak, word_history,
    addXPAndCoins, updateSSR, addWordToHistory, updateDailyStreak,
  } = useProfileStore();

  const { startNewSession, setCurrentWord, recordAnswer, spellStreak } = useGameStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedTongue,     setSelectedTongue]   = useState<'yoruba' | null>(null);
  const [showDownloader,     setShowDownloader]   = useState(false);
  const [isDownloading,      setIsDownloading]    = useState(false);
  const [downloadProgress,   setDownloadProgress] = useState(0);
  const [downloadSpeed,      setDownloadSpeed]    = useState('0 KB/s');
  const [downloadError,      setDownloadError]    = useState<string | null>(null);
  const [downloadedCount,    setDownloadedCount]  = useState(0);
  const [currentWord,        setWord]             = useState<Word | null>(null);
  const [wordIndex,          setWordIndex]         = useState(0);
  const [userInput,          setUserInput]         = useState('');
  const [answerStatus,       setAnswerStatus]      = useState<AnswerStatus>('idle');
  const [correctSpelling,    setCorrectSpelling]   = useState('');
  const [timeLeft,           setTimeLeft]          = useState<number>(TIME_PER_WORD);
  const [ajalaState,         setAjalaState]        = useState<AjalaState>('wazobia');
  const [ajalaCorrect,       setAjalaCorrect]      = useState(false);
  const [ajalaWrong,         setAjalaWrong]        = useState(false);
  const [showCorrectFlash,   setShowCorrectFlash]  = useState(false);
  const [showContext,        setShowContext]        = useState(false);
  const [isLoading,          setIsLoading]         = useState(true);
  const [currentSSR,         setCurrentSSR]        = useState(wazobia_ssr);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [ssrDelta,           setSsrDelta]          = useState(0);
  const [xpReward,           setXpReward]          = useState(0);
  const [coinReward,         setCoinReward]        = useState(0);
  const [proverb,            setProverb]           = useState<Proverb | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef    = useRef<string[]>([]);
  const progressAnim  = useRef(new Animated.Value(1)).current;
  const feedbackFade  = useRef(new Animated.Value(0)).current;
  const advancingRef  = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const flashFeedback = useCallback(() => {
    feedbackFade.setValue(1);
    Animated.timing(feedbackFade, { toValue: 0, duration: 1000, useNativeDriver: true }).start();
  }, [feedbackFade]);

  // ── Load next word ─────────────────────────────────────────────────────────
  const loadNextWord = useCallback((ssrForSelection: number, _index?: number) => {
    // Yoruba / wazobia mode
    const next = getNextWord(ssrForSelection, 'wazobia', 'yo', sessionRef.current, word_history?.yoruba || []);
    if (!next) { router.replace('/result' as any); return; }

    sessionRef.current = [...sessionRef.current, next.id];
    setCurrentWord(next);
    setWord(next);
    
    // Auto-fill initial spaces or hyphens if any using grapheme clusters
    let initialInput = '';
    if (next) {
      const targetChars = next.text.match(/[\s\S][\u0300-\u036f]*/g) || [];
      for (const char of targetChars) {
        if (char === ' ' || char === '-') {
          initialInput += char;
        } else {
          break;
        }
      }
    }
    setUserInput(initialInput.toUpperCase());

    setAnswerStatus('idle');
    setShowContext(false);
    setProverb(null);
    setTimeLeft(TIME_PER_WORD);
    setIsLoading(false);

    // Speak word in Yoruba using phonetic fallback if needed
    setTimeout(() => speak(next.text, 'yo', 0.85, next.phonetic, next.id), 500);
    progressAnim.setValue(1);
  }, [word_history?.yoruba, setCurrentWord, router]);

  // ── Advance to next word ───────────────────────────────────────────────────
  const advance = useCallback((nextSSR: number, nextIdx: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }

    const delay = nextIdx >= WORDS_PER_ROUND ? 3000 : 5000; // longer delay for proverbs review

    advanceTimerRef.current = setTimeout(() => {
      advancingRef.current = false;
      advanceTimerRef.current = null;
      setAjalaState('wazobia');
      if (nextIdx >= WORDS_PER_ROUND) {
        router.replace('/result' as any);
      } else {
        setWordIndex(nextIdx);
        loadNextWord(nextSSR, nextIdx);
      }
    }, delay);
  }, [router, loadNextWord]);

  const handleNextWord = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    advancingRef.current = false;
    setAjalaState('wazobia');

    const nextIdx = wordIndex + 1;
    if (nextIdx >= WORDS_PER_ROUND) {
      router.replace('/result' as any);
    } else {
      setWordIndex(nextIdx);
      loadNextWord(currentSSR, nextIdx);
    }
  }, [wordIndex, currentSSR, router, loadNextWord]);

  // ── Timeout handler ────────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (!currentWord || answerStatus !== 'idle') return;
    clearTimer();
    stopSpeaking();
    setAnswerStatus('timeout');
    setCorrectSpelling(currentWord.text);
    setAjalaState('sandbox');
    setAjalaWrong(true);
    setTimeout(() => setAjalaWrong(false), 800);
    flashFeedback();
    playWrong();

    // isWazobia = true in ELO calculations
    const delta = calculateSSRDelta(currentSSR, currentWord.ssr, false, true);
    const newSSR = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, currentSSR + delta));

    setSsrDelta(delta);
    setXpReward(0);
    setCoinReward(0);

    updateSSR(0, delta);
    addWordToHistory('yoruba', currentWord.id);
    recordAnswer(false, userInput || '[Timeout]');
    setCurrentSSR(newSSR);
    advance(newSSR, wordIndex + 1);
  }, [currentWord, answerStatus, currentSSR, wordIndex, clearTimer, flashFeedback, advance, userInput]);

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!currentWord || answerStatus !== 'idle' || userInput.trim().length === 0) return;
    clearTimer();
    stopSpeaking();

    const normalizedInput = userInput.trim().toLowerCase().normalize('NFC');
    const normalizedTarget = currentWord.text.toLowerCase().normalize('NFC');
    const isCorrect = normalizedInput === normalizedTarget;

    if (isCorrect) {
      setAnswerStatus('correct');
      setShowCorrectFlash(true);
      setTimeout(() => setShowCorrectFlash(false), 900);
      setAjalaCorrect(true);
      setTimeout(() => setAjalaCorrect(false), 900);
      flashFeedback();
      playGangan(); // Gangan drum feedback!

      // Fetch linked proverb
      const linkedProverb = getProverbForWord(currentWord.id);
      setProverb(linkedProverb);

      const delta   = calculateSSRDelta(currentSSR, currentWord.ssr, true, true);
      const newSSR  = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, currentSSR + delta));
      const reward  = calculateReward(currentWord.ssr, true, spellStreak, false);

      setSsrDelta(delta);
      setXpReward(reward.xp);
      setCoinReward(reward.coins);

      updateSSR(0, delta);
      addXPAndCoins(reward.xp, reward.coins);
      addWordToHistory('yoruba', currentWord.id);
      updateDailyStreak();
      recordAnswer(true, userInput);
      setCurrentSSR(newSSR);
      advance(newSSR, wordIndex + 1);
    } else {
      setAnswerStatus('wrong');
      setCorrectSpelling(currentWord.text);
      setAjalaState('sandbox');
      setAjalaWrong(true);
      setTimeout(() => setAjalaWrong(false), 900);
      flashFeedback();
      playWrong();

      const delta  = calculateSSRDelta(currentSSR, currentWord.ssr, false, true);
      const newSSR = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, currentSSR + delta));

      setSsrDelta(delta);
      setXpReward(0);
      setCoinReward(0);

      updateSSR(0, delta);
      addWordToHistory('yoruba', currentWord.id);
      recordAnswer(false, userInput);
      setCurrentSSR(newSSR);
      advance(newSSR, wordIndex + 1);
    }
  }, [currentWord, answerStatus, userInput, currentSSR, spellStreak, wordIndex, clearTimer, flashFeedback, advance]);

  // ── Keyboard press handlers ────────────────────────────────────────────────
  const handleKeyPress = useCallback((key: string) => {
    if (!currentWord) return;

    if (key === '◌́' || key === '◌̀') {
      const tone = key === '◌́' ? 'acute' : 'grave';
      setUserInput(prev => handleTonePress(prev, tone));
      return;
    }

    setUserInput(prev => {
      const targetChars = currentWord.text.match(/[\s\S][\u0300-\u036f]*/g) || [];
      const prevChars = prev.match(/[\s\S][\u0300-\u036f]*/g) || [];

      if (prevChars.length >= targetChars.length) {
        return prev;
      }

      let nextInput = prev + key;
      let nextChars = nextInput.match(/[\s\S][\u0300-\u036f]*/g) || [];

      while (nextChars.length < targetChars.length) {
        const nextTargetChar = targetChars[nextChars.length];
        if (nextTargetChar === ' ' || nextTargetChar === '-') {
          nextInput += nextTargetChar;
          nextChars = nextInput.match(/[\s\S][\u0300-\u036f]*/g) || [];
        } else {
          break;
        }
      }

      const finalChars = nextInput.match(/[\s\S][\u0300-\u036f]*/g) || [];
      return finalChars.slice(0, targetChars.length).join('');
    });
  }, [currentWord]);

  const handleKeyDelete = useCallback(() => {
    setUserInput(prev => {
      const chars = prev.match(/[\s\S][\u0300-\u036f]*/g) || [];
      if (chars.length === 0) return '';
      
      let nextChars = chars.slice(0, -1);
      while (nextChars.length > 0) {
        const lastChar = nextChars[nextChars.length - 1];
        if (lastChar === ' ' || lastChar === '-') {
          nextChars = nextChars.slice(0, -1);
        } else {
          break;
        }
      }
      return nextChars.join('');
    });
  }, []);

  // ── Session initialization ─────────────────────────────────────────────────
  const startYorubaSession = () => {
    setSelectedTongue('yoruba');
    startNewSession();
    sessionRef.current = [];
    setCurrentSSR(wazobia_ssr);
    setIsLoading(true);
    loadNextWord(wazobia_ssr, 0);
    initAudio();
  };

  const handleYorubaPress = async () => {
    try {
      const val = await AsyncStorage.getItem('sabispell:wazobia_yo_audio_downloaded_femi_v1');
      const sampleFile = `${FileSystem.documentDirectory}yoruba_audio/yw_001.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(sampleFile);
      const isValid = fileInfo.exists && 'size' in fileInfo && fileInfo.size > 1000;

      if (val === 'true' && isValid) {
        startYorubaSession();
      } else {
        // If files are corrupted or missing, clear storage & folder to force re-extraction
        if (val === 'true' || fileInfo.exists) {
          await AsyncStorage.removeItem('sabispell:wazobia_yo_audio_downloaded_femi_v1');
          try {
            await FileSystem.deleteAsync(`${FileSystem.documentDirectory}yoruba_audio/`, { idempotent: true });
          } catch (_) {}
        }
        setShowDownloader(true);
      }
    } catch {
      setShowDownloader(true);
    }
  };

  const startAudioPackDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadedCount(0);
    setDownloadSpeed('Initializing...');
    setDownloadError(null);

    try {
      const words = loadWordBank('wazobia', 'yo');
      const total = words.length;
      if (total === 0) {
        throw new Error('No words found in word bank');
      }

      // Ensure target directory exists
      const targetDir = `${FileSystem.documentDirectory}yoruba_audio/`;
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      }

      let downloaded = 0;

      for (let i = 0; i < total; i++) {
        const word = words[i];
        const assetModule = yorubaAssets[word.id];
        if (!assetModule) {
          throw new Error(`Asset not found for word ${word.id}`);
        }

        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const localUri = asset.localUri;
        if (!localUri) {
          throw new Error(`Failed to resolve local uri for asset ${word.id}`);
        }

        const destUri = `${targetDir}${word.id}.mp3`;
        await FileSystem.copyAsync({ from: localUri, to: destUri });

        downloaded++;
        setDownloadedCount(downloaded);
        setDownloadProgress(downloaded / total);
        setDownloadSpeed('Extracting...');

        // Artificial brief delay for realistic progress animation (30ms per file)
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      setDownloadSpeed('Completed');
      await AsyncStorage.setItem('sabispell:wazobia_yo_audio_downloaded_femi_v1', 'true');
      
      setTimeout(() => {
        setShowDownloader(false);
        setIsDownloading(false);
        startYorubaSession();
      }, 1200);
    } catch (error) {
      console.warn('[downloader] audio pack installation failed:', error);
      setDownloadError('Installation failed. Check device storage and try again.');
      setIsDownloading(false);
    }
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    pauseBGM();
    return () => {
      clearTimer();
      stopSpeaking();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      resumeBGM();
    };
  }, []);

  // ── Timer start whenever a new word appears ─────────────────────────────────
  useEffect(() => {
    if (isLoading || !currentWord || answerStatus !== 'idle' || showExitConfirmation || !selectedTongue) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimeout(() => {
            handleTimeout();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [currentWord?.id, isLoading, showExitConfirmation, selectedTongue]);

  // ── Sync progress bar animation with timeLeft ──────────────────────────────
  useEffect(() => {
    if (timeLeft === TIME_PER_WORD) {
      progressAnim.setValue(1);
    } else {
      Animated.timing(progressAnim, {
        toValue: timeLeft / TIME_PER_WORD,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, progressAnim]);

  // ── RENDER TONGUE SELECTION SCREEN ─────────────────────────────────────────
  if (!selectedTongue) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <AnkaraTile />
        <View style={styles.header}>
          <TouchableOpacity id="wazobia-back-btn" onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.brandPrimary }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.selectionScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <View style={[styles.avatarRingSelection, { borderColor: theme.brandAccent }]}>
              <AjalaAvatar state="wazobia" size={72} />
            </View>
            <Text style={[styles.selectionTitle, { color: theme.textPrimary }]}>Ẹ máa wà! 🥁</Text>
            <Text style={[styles.selectionSub, { color: theme.textSecondary }]}>Select your tongue to start spelling</Text>
          </View>

          <View style={styles.tongueGrid}>
            {/* YORUBA CARD */}
            <TouchableOpacity
              id="tongue-card-yoruba"
              onPress={handleYorubaPress}
              style={[styles.tongueCard, Shadows.card, { borderColor: theme.border, borderLeftColor: theme.brandPrimary }]}
              activeOpacity={0.85}
            >
              <View style={styles.tongueCardHeader}>
                <Text style={styles.tongueEmoji}>🇳🇬</Text>
                <View style={styles.tongueTitleBlock}>
                  <Text style={[styles.tongueName, { color: theme.textPrimary }]}>Yoruba</Text>
                  <Text style={[styles.tongueSubText, { color: theme.brandPrimary }]}>Èdè Yorùbá · Active</Text>
                </View>
                <View style={[styles.activeIndicator, { backgroundColor: theme.success }]}>
                  <Text style={styles.activeIndicatorText}>PLAY</Text>
                </View>
              </View>
              <Text style={[styles.tongueDesc, { color: theme.textSecondary }]}>
                Spell with special diacritics and tone marks. Earn rewards while unlocking traditional Yoruba proverbs!
              </Text>
            </TouchableOpacity>

            {/* IGBO CARD (COMING SOON) */}
            <View style={[styles.tongueCard, styles.tongueCardDisabled, Shadows.card]}>
              <View style={styles.tongueCardHeader}>
                <Text style={styles.tongueEmoji}>🦅</Text>
                <View style={styles.tongueTitleBlock}>
                  <Text style={[styles.tongueName, { color: '#777' }]}>Igbo</Text>
                  <Text style={[styles.tongueSubText, { color: '#999' }]}>Asụsụ Igbo · Coming Soon</Text>
                </View>
              </View>
              <Text style={styles.tooltipText}>Coming soon — ìgbà yẹn!</Text>
            </View>

            {/* HAUSA CARD (COMING SOON) */}
            <View style={[styles.tongueCard, styles.tongueCardDisabled, Shadows.card]}>
              <View style={styles.tongueCardHeader}>
                <Text style={styles.tongueEmoji}>🐎</Text>
                <View style={styles.tongueTitleBlock}>
                  <Text style={[styles.tongueName, { color: '#777' }]}>Hausa</Text>
                  <Text style={[styles.tongueSubText, { color: '#999' }]}>Harshen Hausa · Coming Soon</Text>
                </View>
              </View>
              <Text style={styles.tooltipText}>Coming soon — ìgbà yẹn!</Text>
            </View>

            {/* FRENCH CARD (COMING SOON) */}
            <View style={[styles.tongueCard, styles.tongueCardDisabled, Shadows.card]}>
              <View style={styles.tongueCardHeader}>
                <Text style={styles.tongueEmoji}>🗼</Text>
                <View style={styles.tongueTitleBlock}>
                  <Text style={[styles.tongueName, { color: '#777' }]}>French</Text>
                  <Text style={[styles.tongueSubText, { color: '#999' }]}>Langue Française · Coming Soon</Text>
                </View>
              </View>
              <Text style={styles.tooltipText}>Coming soon — ìgbà yẹn!</Text>
            </View>
          </View>
        </ScrollView>

        {/* Yoruba Audio Pack Downloader Modal */}
        <Modal
          visible={showDownloader}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            if (!isDownloading) setShowDownloader(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, Shadows.modal]}>
              <View style={[styles.modalEmojiContainer, { backgroundColor: theme.brandPrimary + '15' }]}>
                <Text style={styles.modalEmojiText}>🔊</Text>
              </View>
              
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                Yoruba Voice Data Pack
              </Text>
              
              <Text style={[styles.modalMessageText, { color: theme.textSecondary }]}>
                SabiSpell requires a high-fidelity audio pack to pronounce Yoruba words with native tone accents. This guarantees perfect offline pronunciation.
              </Text>

              <View style={styles.downloadDetailRow}>
                <Text style={[styles.downloadDetailLabel, { color: theme.textMuted }]}>
                  Download Size:
                </Text>
                <Text style={[styles.downloadDetailValue, { color: theme.brandPrimary }]}>
                  ~500 KB
                </Text>
              </View>

              {downloadError && (
                <Text style={{ color: theme.error, fontSize: 13, marginBottom: 16, textAlign: 'center', fontFamily: FontFamily.bodySemiBold }}>
                  ⚠️ {downloadError}
                </Text>
              )}

              {isDownloading ? (
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                    {downloadProgress === 1.0 
                      ? 'Installing voice pack...' 
                      : `Downloading... ${Math.round(downloadProgress * 100)}%`}
                  </Text>
                  
                  <View style={[styles.downloadProgressTrack, { backgroundColor: theme.bgSecondary }]}>
                    <View style={[styles.downloadProgressFill, {
                      backgroundColor: theme.brandPrimary,
                      width: `${downloadProgress * 100}%`
                    }]} />
                  </View>

                  <View style={styles.progressSubRow}>
                    <Text style={[styles.progressSubText, { color: theme.textMuted }]}>
                      {downloadSpeed}
                    </Text>
                    <Text style={[styles.progressSubText, { color: theme.textMuted }]}>
                      {downloadedCount} / 50 files
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setDownloadError(null);
                      setShowDownloader(false);
                    }}
                    style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={startAudioPackDownload}
                    style={[styles.modalConfirmBtn, { backgroundColor: theme.brandPrimary }]}
                  >
                    <Text style={styles.modalConfirmText}>{downloadError ? 'Retry' : 'Download Pack'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── LOADING STATE FOR SELECTED TONGUE ──────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
        <View style={styles.centerLoading}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Ẹ dákẹ́ díẹ̀… Preparing Yoruba word bank…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timerColor = timeLeft > 15 ? theme.success : timeLeft > 8 ? theme.warning : theme.error;

  const pips = Array.from({ length: WORDS_PER_ROUND }, (_, i) =>
    i < wordIndex ? 'done' : i === wordIndex ? 'active' : 'pending'
  );

  // ── YORUBA WAZOBIA GAMEPLAY HUD ────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <AnkaraTile />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity id="wazobia-close-btn" onPress={() => setShowExitConfirmation(true)}>
            <Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.pips}>
            {pips.map((s, i) => (
              <View key={i} style={[
                styles.pip,
                s === 'done'    && { backgroundColor: theme.success },
                s === 'active'  && { backgroundColor: theme.brandPrimary, transform: [{ scale: 1.25 }] },
                s === 'pending' && { backgroundColor: theme.bgSecondary },
              ]} />
            ))}
          </View>

          <View style={[styles.ssrBadge, { backgroundColor: theme.brandPrimary + '15', borderColor: theme.brandPrimary + '35' }]}>
            <Text style={[styles.ssrText, { color: theme.brandPrimary }]}>WAZOBIA SSR {currentSSR}</Text>
          </View>
        </View>

        {/* Timer Bar */}
        <View style={[styles.timerTrack, { backgroundColor: theme.bgSecondary }]}>
          <Animated.View style={[styles.timerFill, {
            backgroundColor: timerColor,
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
        <Text style={[styles.timerLabel, { color: timerColor }]}>{timeLeft}s</Text>

        {/* Word Display Area */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.wordArea}
          showsVerticalScrollIndicator={false}
        >
          <AjalaAvatar state="wazobia" size={76} triggerCorrect={ajalaCorrect} triggerWrong={ajalaWrong} />

          <Text style={[styles.wordCountLabel, { color: theme.textMuted }]}>
            Yoruba Word {wordIndex + 1} of {WORDS_PER_ROUND}
          </Text>

          {/* Letter Slots */}
          <View style={styles.charSlotsContainer}>
            {currentWord &&
              (currentWord.text.match(/[\s\S][\u0300-\u036f]*/g) || []).map((char, index) => {
                if (char === ' ') {
                  return <View key={index} style={styles.charSlotSpace} />;
                }
                if (char === '-') {
                  return (
                    <View key={index} style={styles.charSlotSpecial}>
                      <Text style={[styles.charSlotText, { color: theme.textPrimary }]}>-</Text>
                    </View>
                  );
                }

                const targetChars = currentWord.text.match(/[\s\S][\u0300-\u036f]*/g) || [];
                const userChars = userInput.match(/[\s\S][\u0300-\u036f]*/g) || [];
                const displayChar = answerStatus === 'correct'
                  ? char.toUpperCase()
                  : (userChars[index] || '');

                const isActive = answerStatus === 'idle' && userChars.length === index;
                const isFilled = !!userChars[index];
                const isLongWord = targetChars.length > 8;

                return (
                  <View
                    key={index}
                    style={[
                      styles.charSlot,
                      isLongWord && styles.charSlotSmall,
                      isActive && [styles.charSlotActive, { borderColor: theme.brandPrimary, backgroundColor: theme.brandPrimary + '10' }],
                      isFilled && [styles.charSlotFilled, { borderColor: theme.brandPrimary }],
                      { backgroundColor: theme.bgCard, borderColor: theme.border }
                    ]}
                  >
                    <Text style={[
                      styles.charSlotText,
                      isLongWord && styles.charSlotTextSmall,
                      { color: theme.textPrimary }
                    ]}>
                      {displayChar}
                    </Text>
                  </View>
                );
              })}
          </View>

          {/* Tone Guide helper if tone marks are needed */}
          {currentWord && currentWord.tone_guide && answerStatus === 'idle' && (
            <View style={styles.toneGuideBox}>
              <Text style={[styles.toneGuideLabel, { color: theme.textMuted }]}>
                💡 Tone Pattern Hint:
              </Text>
              <Text style={[styles.toneGuideText, { color: theme.textSecondary }]}>
                {currentWord.tone_guide}
              </Text>
            </View>
          )}

          {/* Context / Definition Toggle */}
          {answerStatus === 'idle' && (
            <TouchableOpacity
              id="wazobia-context-btn"
              onPress={() => setShowContext(v => !v)}
              style={[styles.contextToggle, { borderColor: theme.border }]}
            >
              <Text style={[styles.contextToggleText, { color: theme.brandPrimary }]}>
                {showContext ? 'Hide definition ▲' : 'Show definition ▼'}
              </Text>
            </TouchableOpacity>
          )}

          {answerStatus === 'idle' && showContext && currentWord && (
            <View style={[styles.contextCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Text style={[styles.contextDef,  { color: theme.textPrimary }]}>{currentWord.definition}</Text>
              {currentWord.context_sentences[0] && (
                <Text style={[styles.contextEx, { color: theme.textSecondary }]}>
                  "{maskWordInSentence(currentWord.context_sentences[0], currentWord.text)}"
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Feedback overlays */}
        {answerStatus !== 'idle' && (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.feedbackOverlay, {
              backgroundColor: answerStatus === 'correct' ? theme.success + '20' : theme.error + '20',
              opacity: feedbackFade,
            }]}
          />
        )}

        {showCorrectFlash && (
          <View style={styles.correctOverlay} pointerEvents="none">
            <Text style={styles.correctTick}>✓</Text>
          </View>
        )}

        {/* Input & Yoruba Keyboard Area */}
        {answerStatus === 'idle' && (
          <View style={styles.inputArea}>
            <View style={styles.chipsRow}>
              <TouchableOpacity id="wazobia-speak-btn" onPress={() => currentWord && speak(currentWord.text, 'yo', 0.85, currentWord.phonetic, currentWord.id)}
                style={[styles.chip, { borderColor: theme.border }]}>
                <Text style={[styles.chipText, { color: theme.brandPrimary }]}>🔊 Hear Word</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {answerStatus === 'idle' && (
          <View style={[styles.keyboardContainer, { backgroundColor: theme.bgSecondary, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 22) }]}>
            <View style={styles.keyboardWrapper}>
              
              {/* Yoruba Accent Toolbar Bar (Terracotta tinted, comfortable size) */}
              <View style={[styles.row, styles.accentBarRow]}>
                {['Ẹ', 'Ọ', 'Ṣ', 'GB', '◌́', '◌̀'].map((key) => {
                  const isModifier = key === '◌́' || key === '◌̀';
                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleKeyPress(key)}
                      style={({ pressed }) => [
                        styles.key,
                        {
                          backgroundColor: isModifier ? '#FFEBE3' : '#FFF3EE',
                          borderColor: theme.brandPrimary,
                          borderBottomWidth: 3.5,
                          width: ACCENT_KEY_WIDTH,
                          height: KEY_HEIGHT,
                          transform: [{ scale: pressed ? 0.90 : 1 }],
                        },
                      ]}
                    >
                      <Text style={[styles.keyText, { color: theme.brandPrimary, fontFamily: FontFamily.headingSemi }]}>
                        {key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Standard QWERTY rows below */}
              {[
                ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
              ].map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {/* Action button at the start of Row 3 */}
                  {rowIndex === 2 && (
                    <Pressable
                      disabled={answerStatus !== 'idle'}
                      onPress={handleSubmit}
                      style={({ pressed }) => [
                        styles.key,
                        styles.specialKey,
                        {
                          backgroundColor: theme.success,
                          borderColor: theme.success,
                          width: KEY_WIDTH * 1.5,
                          height: KEY_HEIGHT,
                          transform: [{ scale: pressed ? 0.90 : 1 }],
                        },
                      ]}
                    >
                      <CheckIcon color="#FFFFFF" />
                    </Pressable>
                  )}

                  {row.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => handleKeyPress(key)}
                      style={({ pressed }) => [
                        styles.key,
                        {
                          backgroundColor: theme.bgCard,
                          borderColor: theme.border,
                          width: KEY_WIDTH,
                          height: KEY_HEIGHT,
                          transform: [{ scale: pressed ? 0.90 : 1 }],
                        },
                      ]}
                    >
                      <Text style={[styles.keyText, { color: theme.textPrimary }]}>
                        {key}
                      </Text>
                    </Pressable>
                  ))}

                  {/* Delete button at the end of Row 3 */}
                  {rowIndex === 2 && (
                    <Pressable
                      disabled={answerStatus !== 'idle'}
                      onPress={handleKeyDelete}
                      style={({ pressed }) => [
                        styles.key,
                        styles.specialKey,
                        {
                          backgroundColor: theme.error + '25',
                          borderColor: theme.border,
                          width: KEY_WIDTH * 1.5,
                          height: KEY_HEIGHT,
                          transform: [{ scale: pressed ? 0.90 : 1 }],
                        },
                      ]}
                    >
                      <DeleteIcon color={theme.error} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* BOTTOM INTERACTIVE FEEDBACK CARD */}
        {answerStatus !== 'idle' && (
          <View style={[
            styles.feedbackCard,
            {
              backgroundColor: theme.bgCard,
              borderTopColor: answerStatus === 'correct' ? theme.success : theme.error,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
              height: (proverb ? 350 : 290) + insets.bottom,
            }
          ]}>
            <View style={styles.feedbackHeader}>
              <Text style={[
                styles.feedbackTitle,
                { color: answerStatus === 'correct' ? theme.success : theme.error }
              ]}>
                {answerStatus === 'correct' ? 'Gbọ̀n-ọ̀n-gbọ̀n! Correct! 🥁' : 'Incorrect ✗'}
              </Text>
              <View style={styles.rewardsRow}>
                {answerStatus === 'correct' ? (
                  <>
                    <View style={[styles.rewardBadge, { backgroundColor: '#E8F8EF' }]}>
                      <Text style={[styles.rewardText, { color: theme.success }]}>+{xpReward} XP</Text>
                    </View>
                    <View style={[styles.rewardBadge, { backgroundColor: '#FFF9E6' }]}>
                      <Text style={[styles.rewardText, { color: '#F5A623' }]}>+{coinReward} 🪙</Text>
                    </View>
                    <View style={[styles.rewardBadge, { backgroundColor: '#FDF3EE' }]}>
                      <Text style={[styles.rewardText, { color: theme.brandPrimary }]}>+{ssrDelta} SSR</Text>
                    </View>
                  </>
                ) : (
                  <View style={[styles.rewardBadge, { backgroundColor: '#FFF0F0' }]}>
                    <Text style={[styles.rewardText, { color: theme.error }]}>{ssrDelta} SSR</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.comparisonContainer}>
              {answerStatus === 'correct' ? (
                <Text style={[styles.correctSpellingText, { color: theme.success }]}>
                  {currentWord?.text.toUpperCase()}
                </Text>
              ) : (
                <View style={styles.comparisonDetails}>
                  <Text style={[styles.comparisonLabel, { color: theme.textSecondary }]}>
                    Correct: <Text style={[styles.comparisonWord, { color: theme.success }]}>{currentWord?.text.toUpperCase()}</Text>
                  </Text>
                  <Text style={[styles.comparisonLabel, { color: theme.textSecondary }]}>
                    You spelled: <Text style={[styles.comparisonWord, { color: theme.error, textDecorationLine: 'line-through' }]}>
                      {userInput ? userInput.toUpperCase() : '[None]'}
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Scrollable details containing proverbs or definition */}
            <ScrollView style={styles.feedbackDefinitionScroll} contentContainerStyle={styles.feedbackDefinitionContent}>
              {proverb ? (
                <View style={styles.proverbCard}>
                  <Text style={styles.proverbBadgeLabel}>📜 TRADITIONAL YORUBA PROVERB</Text>
                  <Text style={[styles.proverbOriginal, { color: theme.brandPrimary }]}>
                    "{proverb.original}"
                  </Text>
                  <Text style={[styles.proverbTranslation, { color: theme.textSecondary }]}>
                    Translation: {proverb.translation}
                  </Text>
                  {proverb.tone_guide && (
                    <Text style={[styles.proverbTone, { color: theme.textMuted }]}>
                      Tones: {proverb.tone_guide}
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  <Text style={[styles.feedbackDefinition, { color: theme.textPrimary }]}>
                    {currentWord?.definition}
                  </Text>
                  {currentWord?.context_sentences[0] && (
                    <Text style={[styles.feedbackExample, { color: theme.textSecondary }]}>
                      "{maskWordInSentence(currentWord.context_sentences[0], currentWord.text)}"
                    </Text>
                  )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              id="wazobia-next-btn"
              onPress={handleNextWord}
              style={[
                styles.feedbackNextBtn,
                { backgroundColor: answerStatus === 'correct' ? theme.success : theme.brandPrimary }
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.feedbackNextBtnText}>
                {wordIndex + 1 >= WORDS_PER_ROUND ? 'View Results 📊' : 'Next Word ➡️'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Exit Confirmation Modal */}
        <Modal
          visible={showExitConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowExitConfirmation(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, Shadows.modal]}>
              <View style={[styles.modalEmojiContainer, { backgroundColor: theme.error + '15' }]}>
                <Text style={styles.modalEmojiText}>⚠️</Text>
              </View>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                Exit Game?
              </Text>
              <Text style={[styles.modalMessageText, { color: theme.textSecondary }]}>
                Are you sure you want to quit? Your progress in this round will be lost, and energy spent cannot be refunded.
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => setShowExitConfirmation(false)}
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Keep Playing</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    setShowExitConfirmation(false);
                    stopSpeaking();
                    router.back();
                  }}
                  style={[styles.modalConfirmBtn, { backgroundColor: theme.error }]}>
                  <Text style={styles.modalConfirmText}>Yes, Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  back:       { fontSize: FontSizes.md, fontFamily: FontFamily.bodySemiBold },
  closeBtn:   { fontSize: FontSizes.xl, width: 36, textAlign: 'center' },
  pips:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pip:        { width: 12, height: 12, borderRadius: 6 },
  ssrBadge:   { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1 },
  ssrText:    { fontSize: FontSizes.xs, fontFamily: FontFamily.mono, fontWeight: '700' },

  // Selection styles
  selectionScroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  titleSection:    { alignItems: 'center', marginVertical: Spacing.lg },
  avatarRingSelection: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3EE', marginBottom: Spacing.md },
  selectionTitle:  { fontSize: FontSizes.xxl, fontFamily: FontFamily.heading, marginBottom: 4 },
  selectionSub:    { fontSize: FontSizes.sm, fontFamily: FontFamily.body, textAlign: 'center' },

  tongueGrid:      { gap: Spacing.md },
  tongueCard:      { backgroundColor: GlobalColors.white, borderRadius: Radii.lg, padding: Spacing.base, borderLeftWidth: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  tongueCardDisabled: { backgroundColor: '#F0F0F0', borderLeftColor: '#CCC', borderColor: 'rgba(0,0,0,0.04)', opacity: 0.75 },
  tongueCardHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  tongueEmoji:     { fontSize: 28, marginRight: Spacing.sm },
  tongueTitleBlock:{ flex: 1 },
  tongueName:      { fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi },
  tongueSubText:   { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold },
  tongueDesc:      { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: FontSizes.sm * 1.5 },
  tooltipText:     { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold, fontStyle: 'italic', color: '#888' },
  activeIndicator: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.xs },
  activeIndicatorText: { color: '#FFF', fontSize: 10, fontFamily: FontFamily.heading, fontWeight: 'bold' },

  // HUD layout styles
  centerLoading:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:    { fontSize: FontSizes.md, fontFamily: FontFamily.body },
  timerTrack:     { height: 5, marginHorizontal: Spacing.base, borderRadius: 3, overflow: 'hidden' },
  timerFill:      { height: '100%', borderRadius: 3 },
  timerLabel:     { textAlign: 'right', paddingRight: Spacing.base, fontSize: FontSizes.xs, fontFamily: FontFamily.mono, marginTop: 3, marginBottom: Spacing.xs },

  wordArea:       { alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.xs, paddingBottom: Spacing.md, width: '100%' },
  wordCountLabel: { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold, marginTop: Spacing.sm, letterSpacing: 0.5 },
  charSlotsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingHorizontal: Spacing.md },
  charSlot:       { width: 36, height: 46, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.05, shadowRadius: 1.5, elevation: 1 },
  charSlotSmall:  { width: 28, height: 38, borderRadius: 6 },
  charSlotSpace:  { width: 10, height: 38 },
  charSlotSpecial:{ width: 14, height: 38, justifyContent: 'center', alignItems: 'center' },
  charSlotActive: { borderWidth: 2.2 },
  charSlotFilled: { borderWidth: 2.2 },
  charSlotText:   { fontSize: 20, fontFamily: FontFamily.heading, fontWeight: 'bold' },
  charSlotTextSmall: { fontSize: 15 },

  toneGuideBox:   { marginTop: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: '#FFF3EE', borderRadius: Radii.sm, borderWidth: 1, borderColor: '#F5DDD0', alignItems: 'center' },
  toneGuideLabel: { fontSize: 10, fontFamily: FontFamily.bodySemiBold, letterSpacing: 0.5, marginBottom: 2 },
  toneGuideText:  { fontSize: FontSizes.sm, fontFamily: FontFamily.bodyMedium, fontStyle: 'italic' },

  contextToggle:     { marginTop: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.sm, borderWidth: 1 },
  contextToggleText: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  contextCard:       { width: '100%', marginTop: Spacing.sm, padding: Spacing.md, borderRadius: Radii.md, borderWidth: 1 },
  contextDef:        { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: FontSizes.sm * 1.55, marginBottom: Spacing.xs },
  contextEx:         { fontSize: FontSizes.sm, fontFamily: FontFamily.bodyMedium, fontStyle: 'italic', lineHeight: FontSizes.sm * 1.5, marginBottom: Spacing.xs },

  feedbackOverlay: { zIndex: 5 },
  correctOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  correctTick:     { fontSize: 80, color: '#2D7D46' },

  inputArea: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  chipsRow:  { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  chip:      { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.lg, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText:  { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold },

  // Custom Yoruba Keyboard
  keyboardContainer: { paddingTop: 12, borderTopWidth: 1.5, width: '100%', alignItems: 'center' },
  keyboardWrapper:   { width: '100%', paddingHorizontal: 8 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8, gap: KEY_MARGIN * 2 },
  accentBarRow: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193,68,14,0.15)',
    paddingBottom: 8,
  },
  key: {
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 2,
  },
  specialKey: { justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: isSmallDevice ? 14 : 16, fontFamily: FontFamily.mono, fontWeight: 'bold' },

  // Feedback Bottom Card
  feedbackCard: {
    padding: Spacing.md,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8C5B0',
    borderTopWidth: 4,
    justifyContent: 'space-between',
  },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  feedbackTitle:  { fontSize: FontSizes.lg, fontFamily: FontFamily.heading },
  rewardsRow:     { flexDirection: 'row', gap: 6 },
  rewardBadge:    { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.sm },
  rewardText:     { fontSize: FontSizes.xs, fontFamily: FontFamily.headingSemi },

  comparisonContainer: { marginBottom: Spacing.sm, backgroundColor: '#FAFAFA', padding: Spacing.sm, borderRadius: Radii.sm, borderWidth: 1, borderColor: '#EEEEEE' },
  correctSpellingText: { fontSize: 20, fontFamily: FontFamily.mono, letterSpacing: 2, fontWeight: 'bold', textAlign: 'center' },
  comparisonDetails:   { gap: 4 },
  comparisonLabel:     { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  comparisonWord:      { fontFamily: FontFamily.mono, fontSize: FontSizes.md, letterSpacing: 1, fontWeight: 'bold' },

  feedbackDefinitionScroll: { flex: 1, marginBottom: Spacing.sm },
  feedbackDefinitionContent: { paddingBottom: Spacing.xs },
  feedbackDefinition: { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: 18, marginBottom: 4 },
  feedbackExample:    { fontSize: FontSizes.xs, fontFamily: FontFamily.bodyMedium, fontStyle: 'italic' },

  feedbackNextBtn: {
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  feedbackNextBtnText: { color: '#FFFFFF', fontSize: FontSizes.base, fontFamily: FontFamily.headingSemi },

  // Proverbs display
  proverbCard: {
    padding: Spacing.md,
    backgroundColor: '#FFFBF0',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E8C5B0',
    marginTop: Spacing.xs,
  },
  proverbBadgeLabel: { fontSize: 9, fontFamily: FontFamily.heading, letterSpacing: 1, color: '#C1440E', marginBottom: 6 },
  proverbOriginal:   { fontSize: FontSizes.md, fontFamily: FontFamily.bodySemiBold, fontStyle: 'italic', marginBottom: Spacing.xs, lineHeight: FontSizes.md * 1.45 },
  proverbTranslation:{ fontSize: FontSizes.sm, fontFamily: FontFamily.body, marginBottom: Spacing.xs, lineHeight: FontSizes.sm * 1.4 },
  proverbTone:       { fontSize: FontSizes.xs, fontFamily: FontFamily.mono },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(110, 38, 8, 0.60)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: GlobalColors.white, borderRadius: Radii.lg, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8C5B0' },
  modalEmojiContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalEmojiText:      { fontSize: 32 },
  modalTitleText:      { fontSize: FontSizes.lg, fontFamily: FontFamily.heading, marginBottom: 8, textAlign: 'center' },
  modalMessageText:    { fontSize: FontSizes.sm, fontFamily: FontFamily.body, marginBottom: 24, textAlign: 'center', lineHeight: 20 },
  modalActionsRow:     { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn:      { flex: 1, height: 48, borderRadius: Radii.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalCancelText:     { fontSize: FontSizes.base, fontFamily: FontFamily.headingSemi },
  modalConfirmBtn:     { flex: 1, height: 48, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  modalConfirmText:    { fontSize: FontSizes.base, fontFamily: FontFamily.headingSemi, color: '#FFFFFF' },
  downloadDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FAFAFA',
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  downloadDetailLabel: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  downloadDetailValue: { fontSize: FontSizes.sm, fontFamily: FontFamily.mono, fontWeight: 'bold' },
  progressContainer: { width: '100%', alignItems: 'stretch', gap: 6 },
  progressLabel: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold, textAlign: 'center', marginBottom: 2 },
  downloadProgressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' },
  downloadProgressFill: { height: '100%', borderRadius: 4 },
  progressSubRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  progressSubText: { fontSize: FontSizes.xs, fontFamily: FontFamily.mono },
});
