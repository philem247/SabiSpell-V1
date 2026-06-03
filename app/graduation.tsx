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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import { useGameStore } from '../src/store/gameStore';
import { loadWordBank, Word, maskWordInSentence } from '../src/services/wordbank';
import {
  isGraduationUnlocked,
  processGraduationResult,
  GRADUATION_SSR_MIN,
  GRADUATION_SSR_MAX,
  GraduationResult,
} from '../src/services/graduation';
import { speak, stopSpeaking } from '../src/services/tts';
import { initAudio, playCorrect, playWrong, playCelebration } from '../src/services/audio';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Spacing, Shadows } from '../src/constants/Colors';
import { AppConfig, getGraduationThreshold } from '../src/constants/AppConfig';
import AjalaAvatar from '../src/components/AjalaAvatar';
import SpellingKeyboard from '../src/components/SpellingKeyboard';

const EXAM_WORDS_COUNT = AppConfig.GRADUATION_EXAM_WORDS; // 20 words
const TIME_PER_WORD = AppConfig.TIME_PER_WORD_SEC; // 45 seconds

type AnswerStatus = 'idle' | 'correct' | 'wrong' | 'timeout';

export default function GraduationExamScreen() {
  const router = useRouter();
  const theme = Themes.sss; // SSS 2 Lagoon Blue theme
  const insets = useSafeAreaInsets();

  // Load profile state
  const {
    word_history,
    coins,
    addXPAndCoins,
    updateProfile,
  } = useProfileStore();

  const isUnlocked = isGraduationUnlocked(word_history?.sss || []);
  const threshold = getGraduationThreshold();

  // ── State ────────────────────────────────────────────────────────────────────
  const [examWords, setExamWords] = useState<Word[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [correctSpelling, setCorrectSpelling] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(TIME_PER_WORD);
  const [ajalaCorrect, setAjalaCorrect] = useState(false);
  const [ajalaWrong, setAjalaWrong] = useState(false);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  // Exam session final score tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [examFinished, setExamFinished] = useState(false);
  const [examResult, setExamResult] = useState<GraduationResult | null>(null);
  const [examHistory, setExamHistory] = useState<{ word: Word; isCorrect: boolean; userInput: string; }[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const feedbackFade = useRef(new Animated.Value(0)).current;
  const advancingRef = useRef(false);
  const advanceExamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctCountRef = useRef(0);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flashFeedback = useCallback(() => {
    feedbackFade.setValue(1);
    Animated.timing(feedbackFade, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [feedbackFade]);

  // Initialize and select 20 exam words within graduation ELO range
  const initExamWords = useCallback(() => {
    const allWords = loadWordBank('sss', 'en');
    let pool = allWords.filter(
      (w) => w.ssr >= GRADUATION_SSR_MIN && w.ssr <= GRADUATION_SSR_MAX
    );
    // Safety check: if word pool is too small, fallback to all SSS words
    if (pool.length < EXAM_WORDS_COUNT) {
      pool = allWords;
    }
    // Shuffle pool and select 20 words
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, EXAM_WORDS_COUNT);
    setExamWords(selected);
    return selected;
  }, []);

  // ── Load next exam word ───────────────────────────────────────────────────────
  const loadNextExamWord = useCallback((wordsList: Word[], index: number) => {
    if (index >= EXAM_WORDS_COUNT) {
      finishExam();
      return;
    }

    const nextWord = wordsList[index];
    setUserInput('');
    setAnswerStatus('idle');
    setShowContext(false);
    setTimeLeft(TIME_PER_WORD);
    progressAnim.setValue(1);

    // Auto-fill initial spaces or hyphens if any
    let initialInput = '';
    if (nextWord) {
      while (initialInput.length < nextWord.text.length) {
        const nextChar = nextWord.text[initialInput.length];
        if (nextChar === ' ' || nextChar === '-') {
          initialInput += nextChar;
        } else {
          break;
        }
      }
    }
    setUserInput(initialInput);
    setIsLoading(false);

    setTimeout(() => speak(nextWord.text, 'en'), 500);
  }, [progressAnim]);

  // ── Start/Reset Exam ──────────────────────────────────────────────────────────
  const startExamFlow = useCallback(() => {
    setIsLoading(true);
    setWordIndex(0);
    setCorrectCount(0);
    correctCountRef.current = 0;
    setExamFinished(false);
    setExamResult(null);
    setAnswerStatus('idle');
    setExamHistory([]);
    setShowBreakdown(false);
    const selectedWords = initExamWords();
    loadNextExamWord(selectedWords, 0);
    setExamStarted(true);
  }, [initExamWords, loadNextExamWord]);

  // ── Mount ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isUnlocked) {
      initAudio();
    }
    return () => {
      clearTimer();
      stopSpeaking();
      if (advanceExamTimerRef.current) {
        clearTimeout(advanceExamTimerRef.current);
      }
    };
  }, [isUnlocked]);

  // ── Timer Effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUnlocked || examFinished || isLoading || examWords.length === 0 || answerStatus !== 'idle' || showExitConfirmation) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [isUnlocked, examWords[wordIndex]?.id, isLoading, answerStatus, showExitConfirmation, examFinished]);

  // ── Sync progress bar animation with timeLeft ────────────────────────────────
  useEffect(() => {
    if (!isUnlocked || examFinished) return;
    if (timeLeft === TIME_PER_WORD) {
      progressAnim.setValue(1);
    } else {
      Animated.timing(progressAnim, {
        toValue: timeLeft / TIME_PER_WORD,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, progressAnim, isUnlocked, examFinished]);

  // ── Advance to next word ──────────────────────────────────────────────────────
  const advanceExam = useCallback((nextIdx: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    if (advanceExamTimerRef.current) {
      clearTimeout(advanceExamTimerRef.current);
    }

    const delay = nextIdx >= EXAM_WORDS_COUNT ? 3000 : 4500;

    advanceExamTimerRef.current = setTimeout(() => {
      advancingRef.current = false;
      advanceExamTimerRef.current = null;
      if (nextIdx >= EXAM_WORDS_COUNT) {
        finishExam();
      } else {
        setWordIndex(nextIdx);
        loadNextExamWord(examWords, nextIdx);
      }
    }, delay);
  }, [examWords, loadNextExamWord]);

  const handleNextExamWord = useCallback(() => {
    if (advanceExamTimerRef.current) {
      clearTimeout(advanceExamTimerRef.current);
      advanceExamTimerRef.current = null;
    }
    advancingRef.current = false;
    const nextIdx = wordIndex + 1;
    if (nextIdx >= EXAM_WORDS_COUNT) {
      finishExam();
    } else {
      setWordIndex(nextIdx);
      loadNextExamWord(examWords, nextIdx);
    }
  }, [wordIndex, examWords, loadNextExamWord]);

  // ── Timeout handler ───────────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    const currentWord = examWords[wordIndex];
    if (!currentWord || answerStatus !== 'idle') return;
    clearTimer();
    stopSpeaking();
    setAnswerStatus('timeout');
    setCorrectSpelling(currentWord.text);
    setAjalaWrong(true);
    setTimeout(() => setAjalaWrong(false), 900);
    flashFeedback();
    playWrong();

    setExamHistory(prev => [...prev, { word: currentWord, isCorrect: false, userInput: userInput || '[Timeout]' }]);
    advanceExam(wordIndex + 1);
  }, [examWords, wordIndex, answerStatus, clearTimer, flashFeedback, userInput, advanceExam]);

  // ── Submit handler ────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const currentWord = examWords[wordIndex];
    if (!currentWord || answerStatus !== 'idle' || userInput.trim().length === 0) return;
    clearTimer();
    stopSpeaking();

    const trimmed = userInput.trim().toLowerCase();
    const isCorrect = trimmed === currentWord.text.toLowerCase();

    setExamHistory(prev => [...prev, { word: currentWord, isCorrect, userInput }]);

    if (isCorrect) {
      setAnswerStatus('correct');
      setShowCorrectFlash(true);
      setTimeout(() => setShowCorrectFlash(false), 900);
      setAjalaCorrect(true);
      setTimeout(() => setAjalaCorrect(false), 900);
      setCorrectCount((prev) => {
        const next = prev + 1;
        correctCountRef.current = next;
        return next;
      });
      flashFeedback();
      playCorrect();
      advanceExam(wordIndex + 1);
    } else {
      setAnswerStatus('wrong');
      setCorrectSpelling(currentWord.text);
      setAjalaWrong(true);
      setTimeout(() => setAjalaWrong(false), 900);
      flashFeedback();
      playWrong();
      advanceExam(wordIndex + 1);
    }
  }, [examWords, wordIndex, answerStatus, userInput, clearTimer, flashFeedback, advanceExam]);

  // ── Finish Exam ───────────────────────────────────────────────────────────────
  const finishExam = () => {
    clearTimer();
    stopSpeaking();
    const result = processGraduationResult(correctCountRef.current, EXAM_WORDS_COUNT);
    setExamResult(result);
    setExamFinished(true);

    if (result.passed) {
      playCelebration();
      // Award XP, coins and mark graduated in state
      addXPAndCoins(result.xpBonus, result.coinBonus);
      updateProfile({
        isGraduated: true,
        graduation_date: new Date().toLocaleDateString(),
      });
      // Delay navigation slightly to let celebration audio start
      setTimeout(() => {
        router.replace('/certificate' as any);
      }, 1000);
    }
  };

  // ── Keyboard Handlers ─────────────────────────────────────────────────────────
  const handleKeyboardPress = useCallback((key: string) => {
    const currentWord = examWords[wordIndex];
    if (!currentWord) return;
    setUserInput((prev) => {
      let nextInput = prev + key;
      const targetLength = currentWord.text.length;
      while (nextInput.length < targetLength) {
        const nextChar = currentWord.text[nextInput.length];
        if (nextChar === ' ' || nextChar === '-') {
          nextInput += nextChar;
        } else {
          break;
        }
      }
      return nextInput.slice(0, targetLength);
    });
  }, [examWords, wordIndex]);

  const handleKeyboardDelete = useCallback(() => {
    setUserInput((prev) => {
      if (prev.length === 0) return '';
      let nextInput = prev.slice(0, -1);
      while (nextInput.length > 0) {
        const lastChar = nextInput[nextInput.length - 1];
        if (lastChar === ' ' || lastChar === '-') {
          nextInput = nextInput.slice(0, -1);
        } else {
          break;
        }
      }
      return nextInput;
    });
  }, []);

  // ── Derived UI ────────────────────────────────────────────────────────────────
  const currentWord = examWords[wordIndex];
  const timerColor = timeLeft > 15 ? theme.success : timeLeft > 8 ? theme.warning : theme.error;

  // 1. Locked Screen View
  if (!isUnlocked) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} id="graduation-locked-back-btn">
            <Text style={[styles.backText, { color: theme.brandPrimary }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lockedContainer}>
          <View style={[styles.lockCard, Shadows.card]}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={[styles.lockedTitle, { color: theme.textPrimary }]}>Graduation Exam</Text>
            <Text style={[styles.lockedSub, { color: theme.textSecondary }]}>LOCKED</Text>
            <Text style={[styles.lockedDesc, { color: theme.textMuted }]}>
              Show your spelling mastery first! Complete at least {threshold} words in the SSS 2 Academic League to unlock the Graduation Exam.
            </Text>

            <View style={styles.progressBarWrapper}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabelText, { color: theme.textSecondary }]}>Unlock Progress</Text>
                <Text style={[styles.progressValueText, { color: theme.brandPrimary }]}>
                  {(word_history?.sss || []).length} / {threshold}
                </Text>
              </View>
              <View style={[styles.lockedProgressTrack, { backgroundColor: theme.bgSecondary }]}>
                <View
                  style={[
                    styles.lockedProgressFill,
                    {
                      backgroundColor: theme.brandPrimary,
                      width: `${Math.min(100, ((word_history?.sss || []).length / threshold) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/mode-select' as any)}
            activeOpacity={0.85}
            style={[styles.lockedCta, { backgroundColor: theme.brandPrimary }, Shadows.button]}
          >
            <Text style={styles.lockedCtaText}>Go to Academic League 📚</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Exam Briefing Screen View (Unstarted)
  if (isUnlocked && !examStarted) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} id="graduation-briefing-back-btn">
            <Text style={[styles.backText, { color: theme.brandPrimary }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lockedContainer}>
          <View style={[styles.lockCard, Shadows.card]}>
            <View style={{ marginBottom: 12 }}>
              <AjalaAvatar state="exam_warrior" size={80} />
            </View>
            <Text style={[styles.lockedTitle, { color: theme.textPrimary }]}>Graduation Exam</Text>
            <Text style={[styles.lockedSub, { color: theme.brandPrimary }]}>READY TO START</Text>
            <Text style={[styles.lockedDesc, { color: theme.textSecondary, marginBottom: 16 }]}>
              Prove your spelling mastery and earn your official certificate of graduation!
            </Text>

            {/* Rules list */}
            <View style={styles.rulesCard}>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleEmoji}>📝</Text>
                <Text style={[styles.ruleText, { color: theme.textPrimary }]}>20 WAEC-level spelling words</Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleEmoji}>⏱️</Text>
                <Text style={[styles.ruleText, { color: theme.textPrimary }]}>45 seconds limit per word</Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleEmoji}>💡</Text>
                <Text style={[styles.ruleText, { color: theme.textPrimary }]}>No hints allowed</Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleEmoji}>🎯</Text>
                <Text style={[styles.ruleText, { color: theme.textPrimary }]}>75% (15/20) score required to pass</Text>
              </View>
            </View>
          </View>

          <View style={styles.failedActionsRow}>
            <TouchableOpacity
              onPress={startExamFlow}
              activeOpacity={0.85}
              style={[styles.failedCtaButton, { backgroundColor: theme.brandPrimary }, Shadows.button]}
            >
              <Text style={styles.failedCtaText}>Start Exam 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              style={[styles.failedCancelButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.failedCancelText, { color: theme.textSecondary }]}>Not Ready Yet 🏠</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Loading State
  if (isLoading || examWords.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Preparing your Exam paper…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Failed Exam View
  if (examFinished && examResult && !examResult.passed) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.failedScrollContainer} showsVerticalScrollIndicator={false}>
          <View style={[styles.lockCard, Shadows.card, { borderColor: theme.error, borderWidth: 1.5 }]}>
            <View style={{ marginBottom: 12 }}>
              <AjalaAvatar state="sandbox" size={80} borderColor={theme.error} />
            </View>
            <Text style={[styles.lockedTitle, { color: theme.textPrimary }]}>Exam Incomplete</Text>
            <Text style={[styles.lockedSub, { color: theme.error }]}>TRY AGAIN</Text>
            
            <View style={styles.scoreSummaryCard}>
              <Text style={[styles.scoreSummaryLabel, { color: theme.textSecondary }]}>Your Score</Text>
              <Text style={[styles.scoreSummaryValue, { color: theme.error }]}>
                {correctCount} / {EXAM_WORDS_COUNT} ({Math.round((correctCount / EXAM_WORDS_COUNT) * 100)}%)
              </Text>
              <Text style={[styles.scoreSummaryRequired, { color: theme.textMuted }]}>
                Required to pass: {Math.round(AppConfig.GRADUATION_PASS_PERCENT * EXAM_WORDS_COUNT)} / {EXAM_WORDS_COUNT} (75%)
              </Text>
            </View>

            <Text style={[styles.lockedDesc, { color: theme.textSecondary, marginTop: 12 }]}>
              Don't worry! You can retake the exam as many times as you need. Revisit the Academic League to brush up on vocabulary, then come back.
            </Text>

            {/* Collapsible Accordion Button */}
            <TouchableOpacity
              id="failed-breakdown-btn"
              onPress={() => setShowBreakdown(v => !v)}
              style={[styles.breakdownToggleBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.breakdownToggleText, { color: theme.brandPrimary }]}>
                {showBreakdown ? 'Hide Spelling Review ▲' : 'View Spelling Review ▼'}
              </Text>
            </TouchableOpacity>

            {showBreakdown && (
              <View style={styles.breakdownList}>
                {examHistory.map((item, idx) => (
                  <View key={idx} style={[
                    styles.breakdownCardItem,
                    {
                      borderColor: item.isCorrect ? theme.success + '30' : theme.error + '30',
                      backgroundColor: item.isCorrect ? '#E8F8EF' : '#FFF0F0'
                    }
                  ]}>
                    <View style={styles.breakdownCardHeader}>
                      <Text style={[
                        styles.breakdownCardCheck,
                        { color: item.isCorrect ? theme.success : theme.error }
                      ]}>
                        {item.isCorrect ? '✓' : '✗'}
                      </Text>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.breakdownCardCorrectText, { color: theme.textPrimary }]}>
                          {item.word.text.toUpperCase()}
                        </Text>
                        {!item.isCorrect && (
                          <Text style={[styles.breakdownCardUserText, { color: theme.textSecondary }]}>
                            Your spelling: <Text style={{ textDecorationLine: 'line-through', color: theme.error }}>
                              {(item.userInput || '').toUpperCase() || '[TIMEOUT]'}
                            </Text>
                          </Text>
                        )}
                        <Text style={[styles.breakdownCardDef, { color: theme.textSecondary }]}>
                          {item.word.definition}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.failedActionsRow}>
            <TouchableOpacity
              onPress={startExamFlow}
              activeOpacity={0.85}
              style={[styles.failedCtaButton, { backgroundColor: theme.brandPrimary }, Shadows.button]}
            >
              <Text style={styles.failedCtaText}>Try Exam Again 🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/dashboard' as any)}
              activeOpacity={0.85}
              style={[styles.failedCancelButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.failedCancelText, { color: theme.textSecondary }]}>Back Home 🏠</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. Gameplay Exam HUD
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity id="graduation-close-btn" onPress={() => setShowExitConfirmation(true)}>
            <Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.examBadge}>
            <Text style={[styles.examBadgeText, { color: theme.brandPrimary }]}>🎓 GRADUATION EXAM</Text>
          </View>

          {/* Balance header flex */}
          <View style={{ width: 36 }} />
        </View>

        {/* ── Timer bar ── */}
        <View style={[styles.timerTrack, { backgroundColor: theme.bgSecondary }]}>
          <Animated.View style={[styles.timerFill, {
            backgroundColor: timerColor,
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
        <Text style={[styles.timerLabel, { color: timerColor }]}>{timeLeft}s</Text>

        {/* ── Word area ── */}
        <View style={styles.wordArea}>
          <AjalaAvatar state="exam_warrior" size={76} triggerCorrect={ajalaCorrect} triggerWrong={ajalaWrong} />

          <Text style={[styles.wordCountLabel, { color: theme.textMuted }]}>
            Word {wordIndex + 1} of {EXAM_WORDS_COUNT}
          </Text>

          <View style={styles.charSlotsContainer}>
            {currentWord && currentWord.text.split('').map((char, index) => {
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

              const displayChar = answerStatus === 'correct'
                ? char.toUpperCase()
                : userInput[index] || '';

              const isActive = answerStatus === 'idle' && userInput.length === index;
              const isFilled = !!userInput[index];
              const isLongWord = currentWord.text.length > 8;

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

          <Text style={[styles.wordDifficulty, { color: theme.textMuted }]}>
            Difficulty: {currentWord.ssr} SSR
          </Text>

          {/* Context toggle */}
          {answerStatus === 'idle' && (
            <TouchableOpacity
              id="graduation-context-btn"
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
        </View>

        {/* ── Feedback overlays ── */}
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



        {/* ── Input area ── */}
        {answerStatus === 'idle' && (
          <View style={styles.inputArea}>
            <View style={styles.chipsRow}>
              <TouchableOpacity id="graduation-speak-btn" onPress={() => currentWord && speak(currentWord.text, 'en')}
                style={[styles.chip, { borderColor: theme.border, flex: 0, width: '100%' }]}>
                <Text style={[styles.chipText, { color: theme.brandPrimary }]}>🔊 Hear Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {answerStatus === 'idle' && (
          <SpellingKeyboard
            onKeyPress={handleKeyboardPress}
            onDelete={handleKeyboardDelete}
            onSubmit={handleSubmit}
            disabled={answerStatus !== 'idle'}
            theme={theme}
          />
        )}

        {answerStatus !== 'idle' && (
          <View style={[
            styles.feedbackCard,
            {
              backgroundColor: theme.bgCard,
              borderTopColor: answerStatus === 'correct' ? theme.success : theme.error,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
              height: 290 + insets.bottom,
            }
          ]}>
            <View style={styles.feedbackHeader}>
              <Text style={[
                styles.feedbackTitle,
                { color: answerStatus === 'correct' ? theme.success : theme.error }
              ]}>
                {answerStatus === 'correct'
                  ? 'Correct! 🎉'
                  : answerStatus === 'timeout'
                  ? "Time's up! ⏰"
                  : 'Incorrect ✗'}
              </Text>
              <View style={styles.rewardsRow}>
                <View style={[styles.rewardBadge, { backgroundColor: '#EEF5FC' }]}>
                  <Text style={[styles.rewardText, { color: theme.brandPrimary }]}>Exam Word {wordIndex + 1} of 20</Text>
                </View>
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

            {currentWord && (
              <ScrollView style={styles.feedbackDefinitionScroll} contentContainerStyle={styles.feedbackDefinitionContent}>
                <Text style={[styles.feedbackDefinition, { color: theme.textPrimary }]}>
                  {currentWord.definition}
                </Text>
                {currentWord.context_sentences[0] && (
                  <Text style={[styles.feedbackExample, { color: theme.textSecondary }]}>
                    "{maskWordInSentence(currentWord.context_sentences[0], currentWord.text)}"
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              id="graduation-next-btn"
              onPress={handleNextExamWord}
              style={[
                styles.feedbackNextBtn,
                { backgroundColor: answerStatus === 'correct' ? theme.success : theme.brandPrimary }
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.feedbackNextBtnText}>
                {wordIndex + 1 >= EXAM_WORDS_COUNT ? 'Finish Exam 🎓' : 'Next Word ➡️'}
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
                Exit Exam?
              </Text>
              <Text style={[styles.modalMessageText, { color: theme.textSecondary }]}>
                Are you sure you want to quit? Your progress in this exam will be lost, and energy spent cannot be refunded.
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => setShowExitConfirmation(false)}
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Resume Exam</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    setShowExitConfirmation(false);
                    stopSpeaking();
                    router.back();
                  }}
                  style={[styles.modalConfirmBtn, { backgroundColor: theme.error }]}
                >
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
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FontSizes.md, fontFamily: FontFamily.body },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  backText: { fontSize: FontSizes.md, fontFamily: FontFamily.bodySemiBold },
  closeBtn: { fontSize: FontSizes.xl, width: 36, textAlign: 'center' },
  examBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    backgroundColor: '#EEF5FC',
    borderWidth: 1,
    borderColor: '#C4DCF4',
  },
  examBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.headingSemi,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  timerTrack: { height: 5, marginHorizontal: Spacing.base, borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  timerLabel: {
    textAlign: 'right',
    paddingRight: Spacing.base,
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.mono,
    marginTop: 3,
    marginBottom: Spacing.xs,
  },

  wordArea: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.xs },
  wordCountLabel: { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold, marginTop: Spacing.sm, letterSpacing: 0.5 },
  charSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  charSlot: {
    width: 36,
    height: 46,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  charSlotSmall: { width: 28, height: 38, borderRadius: 6 },
  charSlotSpace: { width: 10, height: 38 },
  charSlotSpecial: { width: 14, height: 38, justifyContent: 'center', alignItems: 'center' },
  charSlotActive: { borderWidth: 2.2 },
  charSlotFilled: { borderWidth: 2.2 },
  charSlotText: { fontSize: 20, fontFamily: FontFamily.heading, fontWeight: 'bold' },
  charSlotTextSmall: { fontSize: 15 },
  wordDifficulty: { fontSize: FontSizes.xs, fontFamily: FontFamily.body, marginTop: Spacing.xs },

  contextToggle: { marginTop: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.sm, borderWidth: 1 },
  contextToggleText: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  contextCard: { width: '100%', marginTop: Spacing.sm, padding: Spacing.md, borderRadius: Radii.md, borderWidth: 1 },
  contextDef: { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: FontSizes.sm * 1.55, marginBottom: Spacing.xs },
  contextEx: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodyMedium, fontStyle: 'italic', lineHeight: FontSizes.sm * 1.5, marginBottom: Spacing.xs },

  feedbackOverlay: { zIndex: 5 },
  correctOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  correctTick: { fontSize: 80, color: '#27AE60' },
  wrongReveal: {
    marginHorizontal: Spacing.base,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  wrongLabel: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold, marginBottom: 4 },
  wrongSpelling: { fontSize: FontSizes.xl, fontFamily: FontFamily.mono, letterSpacing: 2 },

  inputArea: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, width: '100%' },
  chipsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.sm },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 55, 115, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C4DCF4',
  },
  modalEmojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalEmojiText: {
    fontSize: 32,
  },
  modalTitleText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessageText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
  },
  modalConfirmBtn: {
    flex: 1,
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
  modalConfirmText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    color: '#FFFFFF',
  },

  // Locked Screen Styles
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
    marginBottom: Spacing.xl,
  },
  lockEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  lockedTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    textAlign: 'center',
    marginBottom: 2,
  },
  lockedSub: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.headingSemi,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: Spacing.base,
  },
  lockedDesc: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  progressBarWrapper: {
    width: '100%',
    marginTop: Spacing.base,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressLabelText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
  progressValueText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.mono,
    fontWeight: 'bold',
  },
  lockedProgressTrack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  lockedProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  lockedCta: {
    width: '100%',
    maxWidth: 360,
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCtaText: {
    color: GlobalColors.white,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
  },

  // Failed State Styles
  scoreSummaryCard: {
    width: '100%',
    backgroundColor: '#FDF4F4',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#F8D7D7',
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  scoreSummaryLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 2,
  },
  scoreSummaryValue: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreSummaryRequired: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
  },
  failedActionsRow: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  failedCtaButton: {
    width: '100%',
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedCtaText: {
    color: GlobalColors.white,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
  },
  failedCancelButton: {
    width: '100%',
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedCancelText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: '#EEF5FC',
    borderRadius: Radii.md,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#C4DCF4',
    alignItems: 'stretch',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ruleEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  ruleText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
  },
  feedbackCard: {
    padding: Spacing.md,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C4DCF4',
    borderTopWidth: 4,
    height: 290,
    justifyContent: 'space-between',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feedbackTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rewardBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  rewardText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.headingSemi,
  },
  comparisonContainer: {
    marginBottom: Spacing.sm,
    backgroundColor: '#FAFAFA',
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  correctSpellingText: {
    fontSize: 20,
    fontFamily: FontFamily.mono,
    letterSpacing: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comparisonDetails: {
    gap: 4,
  },
  comparisonLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
  },
  comparisonWord: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.md,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  feedbackDefinitionScroll: {
    flex: 1,
    marginBottom: Spacing.sm,
  },
  feedbackDefinitionContent: {
    paddingBottom: Spacing.xs,
  },
  feedbackDefinition: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    lineHeight: 18,
    marginBottom: 4,
  },
  feedbackExample: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodyMedium,
    fontStyle: 'italic',
  },
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
  feedbackNextBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
  },
  failedScrollContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
  },
  breakdownToggleBtn: {
    width: '100%',
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  breakdownToggleText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingSemi,
  },
  breakdownList: {
    width: '100%',
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  breakdownCardItem: {
    width: '100%',
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  breakdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  breakdownCardCheck: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginTop: -2,
  },
  breakdownCardCorrectText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
  },
  breakdownCardUserText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyMedium,
    marginTop: 2,
  },
  breakdownCardDef: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    marginTop: 4,
    lineHeight: 15,
  },
});
