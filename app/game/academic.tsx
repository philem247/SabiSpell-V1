import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Animated, Platform, StatusBar, Modal,
} from 'react-native';
import SpellingKeyboard from '../../src/components/SpellingKeyboard';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../../src/store/profileStore';
import { useGameStore } from '../../src/store/gameStore';
import { getNextWord, Word, maskWordInSentence } from '../../src/services/wordbank';
import { calculateSSRDelta } from '../../src/services/ssr';
import { calculateReward } from '../../src/services/economy';
import { speak, stopSpeaking } from '../../src/services/tts';
import { initAudio, playCorrect, playWrong } from '../../src/services/audio';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Spacing, Shadows } from '../../src/constants/Colors';
import { AppConfig } from '../../src/constants/AppConfig';
import AjalaAvatar, { AjalaState } from '../../src/components/AjalaAvatar';

const WORDS_PER_ROUND = AppConfig.WORDS_PER_ROUND;
const TIME_PER_WORD   = AppConfig.TIME_PER_WORD_SEC;

type AnswerStatus = 'idle' | 'correct' | 'wrong' | 'timeout';

export default function AcademicGameScreen() {
  const router = useRouter();
  const theme  = Themes.sss;

  const {
    academic_ssr, coins, daily_streak, word_history,
    addXPAndCoins, updateSSR, addWordToHistory, updateDailyStreak,
  } = useProfileStore();

  const { startNewSession, setCurrentWord, recordAnswer, spellStreak } = useGameStore();

  // ── State ────────────────────────────────────────────────────────────────────
  const [currentWord,        setWord]             = useState<Word | null>(null);
  const [wordIndex,          setWordIndex]         = useState(0);
  const [userInput,          setUserInput]         = useState('');
  const [answerStatus,       setAnswerStatus]      = useState<AnswerStatus>('idle');
  const [correctSpelling,    setCorrectSpelling]   = useState('');
  const [timeLeft,           setTimeLeft]          = useState<number>(TIME_PER_WORD);
  const [ajalaState,         setAjalaState]        = useState<AjalaState>('standard');
  const [ajalaCorrect,       setAjalaCorrect]      = useState(false);
  const [ajalaWrong,         setAjalaWrong]        = useState(false);
  const [hintUsed,           setHintUsed]          = useState(false);
  const [hintRevealedIdx,    setHintRevealedIdx]   = useState<number | null>(null);
  const [showCorrectFlash,   setShowCorrectFlash]  = useState(false);
  const [showContext,        setShowContext]        = useState(false);
  const [isLoading,          setIsLoading]         = useState(true);
  const [currentSSR,         setCurrentSSR]        = useState(academic_ssr);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef    = useRef<string[]>([]);
  const progressAnim  = useRef(new Animated.Value(1)).current;
  const feedbackFade  = useRef(new Animated.Value(0)).current;
  const advancingRef  = useRef(false); // guard against double-advance

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const flashFeedback = useCallback(() => {
    feedbackFade.setValue(1);
    Animated.timing(feedbackFade, { toValue: 0, duration: 1000, useNativeDriver: true }).start();
  }, [feedbackFade]);

  const buildDashes = (word: string, hintIdx: number | null): string =>
    word.split('').map((ch, i) => {
      if (ch === ' ') return '  ';
      if (hintIdx !== null && i === hintIdx) return ch.toUpperCase();
      return '_';
    }).join(' ');

  // ── Advance to next word (or end session) ────────────────────────────────────
  const advance = useCallback((nextSSR: number, nextIdx: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTimeout(() => {
      advancingRef.current = false;
      setAjalaState('standard');
      if (nextIdx >= WORDS_PER_ROUND) {
        router.replace('/result' as any);
      } else {
        setWordIndex(nextIdx);
        loadNextWord(nextSSR, nextIdx);
      }
    }, nextIdx >= WORDS_PER_ROUND ? 600 : 1800);
  }, [router]);

  // ── Load next word ────────────────────────────────────────────────────────────
  const loadNextWord = useCallback((ssrForSelection: number, _index?: number) => {
    const next = getNextWord(ssrForSelection, 'sss', 'en', sessionRef.current, word_history.sss);
    if (!next) { router.replace('/result' as any); return; }

    sessionRef.current = [...sessionRef.current, next.id];
    setCurrentWord(next);
    setWord(next);
    
    // Auto-fill initial spaces or hyphens if any
    let initialInput = '';
    if (next) {
      while (initialInput.length < next.text.length) {
        const nextChar = next.text[initialInput.length];
        if (nextChar === ' ' || nextChar === '-') {
          initialInput += nextChar;
        } else {
          break;
        }
      }
    }
    setUserInput(initialInput);

    setAnswerStatus('idle');
    setHintUsed(false);
    setHintRevealedIdx(null);
    setShowContext(false);
    setTimeLeft(TIME_PER_WORD);
    setIsLoading(false);

    setTimeout(() => speak(next.text, 'en'), 500);
    progressAnim.setValue(1);
  }, [word_history.sss, setCurrentWord, router]);

  // ── Timeout handler ───────────────────────────────────────────────────────────
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

    const delta = calculateSSRDelta(currentSSR, currentWord.ssr, false, false);
    const newSSR = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, currentSSR + delta));
    updateSSR(delta, 0);
    addWordToHistory('sss', currentWord.id);
    recordAnswer(false);
    setCurrentSSR(newSSR);
    advance(newSSR, wordIndex + 1);
  }, [currentWord, answerStatus, currentSSR, wordIndex, clearTimer, flashFeedback, advance]);

  // ── Submit handler ────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!currentWord || answerStatus !== 'idle' || userInput.trim().length === 0) return;
    clearTimer();
    stopSpeaking();

    const trimmed   = userInput.trim().toLowerCase();
    const isCorrect = trimmed === currentWord.text.toLowerCase();

    if (isCorrect) {
      setAnswerStatus('correct');
      setShowCorrectFlash(true);
      setTimeout(() => setShowCorrectFlash(false), 900);
      setAjalaCorrect(true);
      setTimeout(() => setAjalaCorrect(false), 900);
      flashFeedback();
      playCorrect();

      const delta   = calculateSSRDelta(currentSSR, currentWord.ssr, true, false);
      const newSSR  = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, currentSSR + delta));
      const reward  = calculateReward(currentWord.ssr, true, spellStreak, false);

      updateSSR(delta, 0);
      addXPAndCoins(reward.xp, reward.coins);
      addWordToHistory('sss', currentWord.id);
      updateDailyStreak();
      recordAnswer(true);
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

      const delta  = calculateSSRDelta(currentSSR, currentWord.ssr, false, false);
      const newSSR = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, currentSSR + delta));
      updateSSR(delta, 0);
      addWordToHistory('sss', currentWord.id);
      recordAnswer(false);
      setCurrentSSR(newSSR);
      advance(newSSR, wordIndex + 1);
    }
  }, [currentWord, answerStatus, userInput, currentSSR, spellStreak, wordIndex, clearTimer, flashFeedback, advance]);

  // ── Hint ──────────────────────────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (!currentWord || hintUsed || coins < AppConfig.HINT_COST_COINS) return;
    const idx = Math.floor(Math.random() * currentWord.text.length);
    setHintRevealedIdx(idx);
    setHintUsed(true);
    addXPAndCoins(0, -AppConfig.HINT_COST_COINS);
  }, [currentWord, hintUsed, coins, addXPAndCoins]);

  // ── Keyboard Helpers ─────────────────────────────────────────────────────────
  const handleKeyboardPress = useCallback((key: string) => {
    if (!currentWord) return;
    setUserInput(prev => {
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
  }, [currentWord]);

  const handleKeyboardDelete = useCallback(() => {
    setUserInput(prev => {
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

  // ── Mount ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    startNewSession();
    sessionRef.current = [];
    setCurrentSSR(academic_ssr);
    loadNextWord(academic_ssr, 0);
    initAudio();
  }, []);

  // ── Timer start whenever a new word appears ───────────────────────────────────
  useEffect(() => {
    if (isLoading || !currentWord || answerStatus !== 'idle' || showExitConfirmation) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); timerRef.current = null; handleTimeout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [currentWord?.id, isLoading, showExitConfirmation]);

  // ── Sync progress bar animation with timeLeft ────────────────────────────────
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

  // ── Derived UI ────────────────────────────────────────────────────────────────
  const timerColor = timeLeft > 15 ? theme.success : timeLeft > 8 ? theme.warning : theme.error;

  const pips = Array.from({ length: WORDS_PER_ROUND }, (_, i) =>
    i < wordIndex ? 'done' : i === wordIndex ? 'active' : 'pending'
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
        <View style={styles.centre}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Getting your word ready…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity id="academic-close-btn" onPress={() => setShowExitConfirmation(true)}>
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
            <Text style={[styles.ssrText, { color: theme.brandPrimary }]}>SSR {currentSSR}</Text>
          </View>
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
          <AjalaAvatar state={ajalaState} size={76} triggerCorrect={ajalaCorrect} triggerWrong={ajalaWrong} />

          <Text style={[styles.wordCountLabel, { color: theme.textMuted }]}>
            Word {wordIndex + 1} of {WORDS_PER_ROUND}
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
                : (userInput[index] || (index === hintRevealedIdx ? char.toUpperCase() : ''));

              const isActive = answerStatus === 'idle' && userInput.length === index;
              const isFilled = !!userInput[index] || index === hintRevealedIdx;
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

          {currentWord && (
            <Text style={[styles.wordDifficulty, { color: theme.textMuted }]}>
              Difficulty: {currentWord.ssr} SSR
            </Text>
          )}

          {/* Context toggle */}
          <TouchableOpacity
            id="academic-context-btn"
            onPress={() => setShowContext(v => !v)}
            style={[styles.contextToggle, { borderColor: theme.border }]}
          >
            <Text style={[styles.contextToggleText, { color: theme.brandPrimary }]}>
              {showContext ? 'Hide definition ▲' : 'Show definition ▼'}
            </Text>
          </TouchableOpacity>

          {showContext && currentWord && (
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

        {(answerStatus === 'wrong' || answerStatus === 'timeout') && (
          <View style={[styles.wrongReveal, { backgroundColor: theme.error + '12', borderColor: theme.error + '35' }]}>
            <Text style={[styles.wrongLabel, { color: theme.error }]}>
              {answerStatus === 'timeout' ? '⏰ Time up!' : '✗ Incorrect'}
            </Text>
            <Text style={[styles.wrongSpelling, { color: theme.textPrimary }]}>{correctSpelling}</Text>
          </View>
        )}

        {/* ── Input area ── */}
        {answerStatus === 'idle' && (
          <View style={styles.inputArea}>
            <View style={styles.chipsRow}>
              <TouchableOpacity id="academic-speak-btn" onPress={() => currentWord && speak(currentWord.text, 'en')}
                style={[styles.chip, { borderColor: theme.border }]}>
                <Text style={[styles.chipText, { color: theme.brandPrimary }]}>🔊 Hear Again</Text>
              </TouchableOpacity>

              <TouchableOpacity id="academic-hint-btn" onPress={handleHint}
                disabled={hintUsed || coins < AppConfig.HINT_COST_COINS}
                style={[styles.chip, { borderColor: hintUsed ? theme.border : theme.warning },
                  (hintUsed || coins < AppConfig.HINT_COST_COINS) && { opacity: 0.45 }]}>
                <Text style={[styles.chipText, { color: hintUsed ? theme.textMuted : theme.warning }]}>
                  💡 Hint ({AppConfig.HINT_COST_COINS} 🪙)
                </Text>
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
  safeArea:     { flex: 1 },
  centre:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:  { fontSize: FontSizes.md, fontFamily: FontFamily.body },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  closeBtn: { fontSize: FontSizes.xl, width: 36, textAlign: 'center' },
  pips:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pip:      { width: 12, height: 12, borderRadius: 6 },
  ssrBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1 },
  ssrText:  { fontSize: FontSizes.xs, fontFamily: FontFamily.mono, fontWeight: '700' },

  timerTrack: { height: 5, marginHorizontal: Spacing.base, borderRadius: 3, overflow: 'hidden' },
  timerFill:  { height: '100%', borderRadius: 3 },
  timerLabel: { textAlign: 'right', paddingRight: Spacing.base, fontSize: FontSizes.xs, fontFamily: FontFamily.mono, marginTop: 3, marginBottom: Spacing.xs },

  wordArea:      { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.xs },
  wordCountLabel:{ fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold, marginTop: Spacing.sm, letterSpacing: 0.5 },
  charSlotsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingHorizontal: Spacing.md },
  charSlot: { width: 36, height: 46, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.05, shadowRadius: 1.5, elevation: 1 },
  charSlotSmall: { width: 28, height: 38, borderRadius: 6 },
  charSlotSpace: { width: 10, height: 38 },
  charSlotSpecial: { width: 14, height: 38, justifyContent: 'center', alignItems: 'center' },
  charSlotActive: { borderWidth: 2.2 },
  charSlotFilled: { borderWidth: 2.2 },
  charSlotText: { fontSize: 20, fontFamily: FontFamily.heading, fontWeight: 'bold' },
  charSlotTextSmall: { fontSize: 15 },
  wordDifficulty:{ fontSize: FontSizes.xs, fontFamily: FontFamily.body, marginTop: Spacing.xs },

  contextToggle:     { marginTop: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.sm, borderWidth: 1 },
  contextToggleText: { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  contextCard:       { width: '100%', marginTop: Spacing.sm, padding: Spacing.md, borderRadius: Radii.md, borderWidth: 1 },
  contextDef:        { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: FontSizes.sm * 1.55, marginBottom: Spacing.xs },
  contextEx:         { fontSize: FontSizes.sm, fontFamily: FontFamily.bodyMedium, fontStyle: 'italic', lineHeight: FontSizes.sm * 1.5, marginBottom: Spacing.xs },

  feedbackOverlay: { zIndex: 5 },
  correctOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  correctTick:     { fontSize: 80, color: '#27AE60' },
  wrongReveal:     { marginHorizontal: Spacing.base, padding: Spacing.md, borderRadius: Radii.md, borderWidth: 1, alignItems: 'center', marginBottom: Spacing.md },
  wrongLabel:      { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold, marginBottom: 4 },
  wrongSpelling:   { fontSize: FontSizes.xl, fontFamily: FontFamily.mono, letterSpacing: 2 },

  inputArea: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  chipsRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  chip:      { flex: 1, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText:  { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold },

  input:      { height: 52, borderRadius: Radii.md, borderWidth: 1.5, paddingHorizontal: Spacing.md, fontSize: FontSizes.lg, marginBottom: Spacing.sm, letterSpacing: 2 },
  submitBtn:  { height: 52, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi, letterSpacing: 0.5 },

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
});
