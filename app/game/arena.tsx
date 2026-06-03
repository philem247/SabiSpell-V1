import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../../src/store/profileStore';
import { useArenaStore } from '../../src/store/arenaStore';
import { getNextWord, Word } from '../../src/services/wordbank';
import { speak, stopSpeaking } from '../../src/services/tts';
import { initAudio, playCorrect, playWrong, playCelebration } from '../../src/services/audio';
import { pauseBGM, resumeBGM } from '../../src/services/bgm';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Spacing, Shadows } from '../../src/constants/Colors';
import { AppConfig } from '../../src/constants/AppConfig';
import AjalaAvatar, { AjalaState } from '../../src/components/AjalaAvatar';
import SpellingKeyboard from '../../src/components/SpellingKeyboard';

const TIME_PER_WORD = AppConfig.TIME_PER_WORD_SEC; // 45 seconds

type PlayerAnswerStatus = 'idle' | 'submitted_correct' | 'submitted_wrong' | 'timeout';
type BotStatus = 'thinking' | 'submitted_correct' | 'submitted_wrong';

export default function ArenaGameScreen() {
  const router = useRouter();
  const theme = Themes.sss;
  const insets = useSafeAreaInsets();

  // Profile store for commiting rewards
  const {
    username,
    academic_ssr,
    addXPAndCoins,
    updateSSR,
    addWordToHistory,
  } = useProfileStore();

  // Arena Store
  const {
    botScore,
    botHistory,
    botThinking,
    botProgress,
    startArenaMatch,
    recordBotAnswer,
    setBotThinking,
    setBotProgress,
  } = useArenaStore();

  // ── States ───────────────────────────────────────────────────────────────────
  const [matchWords, setMatchWords] = useState<Word[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [userInput, setUserInput] = useState('');
  const userInputRef = useRef('');
  userInputRef.current = userInput;
  const [playerAnswerStatus, setPlayerAnswerStatus] = useState<PlayerAnswerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(TIME_PER_WORD);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Rewards calculation states
  const [xpReward, setXpReward] = useState(0);
  const [coinReward, setCoinReward] = useState(0);
  const [playerSsrDelta, setPlayerSsrDelta] = useState(0);
  const [botSsrDelta, setBotSsrDelta] = useState(0);

  // Mascot animation states
  const [ajalaState, setAjalaState] = useState<AjalaState>('standard');
  const [ajalaCorrect, setAjalaCorrect] = useState(false);
  const [ajalaWrong, setAjalaWrong] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearBotTimers = useCallback(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    if (botIntervalRef.current) {
      clearInterval(botIntervalRef.current);
      botIntervalRef.current = null;
    }
  }, []);

  // ── Select 5 words for the Arena Match on Mount ─────────────────────────────
  const initArenaMatch = useCallback(() => {
    setIsLoading(true);
    const pool: Word[] = [];
    const usedIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const nextWord = getNextWord(academic_ssr, 'sss', 'en', usedIds, []);
      if (nextWord) {
        pool.push(nextWord);
        usedIds.push(nextWord.id);
      }
    }

    setMatchWords(pool);
    setRoundIndex(0);
    setPlayerScore(0);
    setUserInput('');
    setPlayerAnswerStatus('idle');
    setTimeLeft(TIME_PER_WORD);
    startArenaMatch();
    setIsLoading(false);
  }, [academic_ssr, startArenaMatch]);

  // ── Start Current Round (Player Timer + SabiBot Turn) ────────────────────────
  const startRound = useCallback((index: number) => {
    if (index >= matchWords.length) {
      // End of match, show podium
      calculateMatchResults();
      return;
    }

    setRoundIndex(index);
    setUserInput('');
    setPlayerAnswerStatus('idle');
    setTimeLeft(TIME_PER_WORD);
    progressAnim.setValue(1);
    setAjalaState('standard');

    // Auto-fill initial spaces or hyphens if any
    const activeWord = matchWords[index];
    let initialInput = '';
    if (activeWord) {
      while (initialInput.length < activeWord.text.length) {
        const nextChar = activeWord.text[initialInput.length];
        if (nextChar === ' ' || nextChar === '-') {
          initialInput += nextChar;
        } else {
          break;
        }
      }
    }
    setUserInput(initialInput);

    // Speak spelling word
    setTimeout(() => speak(activeWord.text, 'en', 0.85, undefined, activeWord.id), 500);

    // Start Player countdown timer
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimeout(() => handlePlayerTimeout(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate SabiBot turn
    clearBotTimers();
    setBotThinking(true);
    setBotProgress(0);

    const minDelay = AppConfig.SABIBOT_ANSWER_DELAY_MIN_MS;
    const maxDelay = AppConfig.SABIBOT_ANSWER_DELAY_MAX_MS;
    const botThinkingDelay = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);

    let elapsed = 0;
    const tickInterval = 200; // updates progress bar every 200ms
    botIntervalRef.current = setInterval(() => {
      elapsed += tickInterval;
      const pct = Math.min(1, elapsed / botThinkingDelay);
      setBotProgress(pct);
    }, tickInterval);

    botTimerRef.current = setTimeout(() => {
      clearBotTimers();
      setBotThinking(false);
      // Simulating Bot Turn Result
      const isBotCorrect = Math.random() < AppConfig.SABIBOT_CORRECT_PROBABILITY;
      recordBotAnswer(isBotCorrect);
    }, botThinkingDelay);

  }, [matchWords, clearTimer, clearBotTimers, setBotThinking, setBotProgress, recordBotAnswer]);

  // ── Player Actions ───────────────────────────────────────────────────────────
  const handlePlayerTimeout = () => {
    stopSpeaking();
    setPlayerAnswerStatus('timeout');
    setAjalaState('sandbox');
    setAjalaWrong(true);
    setTimeout(() => setAjalaWrong(false), 900);
    playWrong();
  };

  const handleSubmit = useCallback(() => {
    const activeWord = matchWords[roundIndex];
    if (!activeWord || playerAnswerStatus !== 'idle' || userInputRef.current.trim().length === 0) return;

    clearTimer();
    stopSpeaking();

    const trimmed = userInputRef.current.trim().toLowerCase();
    const isCorrect = trimmed === activeWord.text.toLowerCase();

    if (isCorrect) {
      setPlayerAnswerStatus('submitted_correct');
      setPlayerScore(prev => prev + 1);
      setAjalaCorrect(true);
      setTimeout(() => setAjalaCorrect(false), 900);
      playCorrect();
    } else {
      setPlayerAnswerStatus('submitted_wrong');
      setAjalaState('sandbox');
      setAjalaWrong(true);
      setTimeout(() => setAjalaWrong(false), 900);
      playWrong();
    }
  }, [matchWords, roundIndex, playerAnswerStatus, clearTimer]);

  const handleNextWord = () => {
    // Save played word to profile history
    const activeWord = matchWords[roundIndex];
    if (activeWord) {
      addWordToHistory('sss', activeWord.id);
    }
    startRound(roundIndex + 1);
  };

  // ── Calculate Match End Results & ELO ───────────────────────────────────────
  const calculateMatchResults = () => {
    // Determine winner
    let xp = 0;
    let coins = 0;
    let pDelta = 0;
    let bDelta = 0;

    if (playerScore > botScore) {
      // Victory
      pDelta = 18;
      bDelta = -12;
      xp = 150;
      coins = 30;
      playCelebration();
    } else if (playerScore < botScore) {
      // Defeat
      pDelta = -12;
      bDelta = 18;
      xp = 20;
      coins = 5;
      playWrong();
    } else {
      // Draw
      pDelta = 4;
      bDelta = 4;
      xp = 60;
      coins = 10;
      playCelebration();
    }

    setXpReward(xp);
    setCoinReward(coins);
    setPlayerSsrDelta(pDelta);
    setBotSsrDelta(bDelta);

    // Commit rewards to profileStore
    addXPAndCoins(xp, coins);
    updateSSR(pDelta, 0);

    // Display match results modal
    setShowResultsModal(true);
  };

  // ── Keyboard Helpers ─────────────────────────────────────────────────────────
  const handleKeyboardPress = useCallback((key: string) => {
    const activeWord = matchWords[roundIndex];
    if (!activeWord) return;
    setUserInput(prev => {
      let nextInput = prev + key;
      const targetLength = activeWord.text.length;
      while (nextInput.length < targetLength) {
        const nextChar = activeWord.text[nextInput.length];
        if (nextChar === ' ' || nextChar === '-') {
          nextInput += nextChar;
        } else {
          break;
        }
      }
      return nextInput.slice(0, targetLength);
    });
  }, [matchWords, roundIndex]);

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

  // ── Mount/Unmount ────────────────────────────────────────────────────────────
  useEffect(() => {
    initArenaMatch();
    initAudio();
    pauseBGM();

    return () => {
      clearTimer();
      clearBotTimers();
      stopSpeaking();
      resumeBGM();
    };
  }, []);

  // Start round 0 when matchWords loads
  useEffect(() => {
    if (matchWords.length > 0) {
      startRound(0);
    }
  }, [matchWords]);

  // Sync player timer progress bar animation
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

  // Derived UI states
  const activeWord = matchWords[roundIndex];
  const botStatus: BotStatus = botThinking
    ? 'thinking'
    : botHistory[roundIndex]
    ? 'submitted_correct'
    : 'submitted_wrong';

  const roundDone = playerAnswerStatus !== 'idle' && !botThinking;

  if (isLoading || !activeWord) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
        <View style={styles.centre}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Entering Spell Arena…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>

        {/* Header HUD */}
        <View style={styles.header}>
          <TouchableOpacity id="arena-back-btn" onPress={() => setShowExitConfirmation(true)}>
            <Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text>
          </TouchableOpacity>

          {/* Scores Display */}
          <View style={styles.scoresRow}>
            <View style={styles.scoreBlock}>
              <Text style={[styles.playerName, { color: theme.textPrimary }]}>{username || 'You'}</Text>
              <Text style={[styles.scoreValue, { color: theme.brandPrimary }]}>{playerScore}</Text>
            </View>
            <Text style={[styles.scoreDivider, { color: theme.textMuted }]}>vs</Text>
            <View style={styles.scoreBlock}>
              <Text style={[styles.playerName, { color: theme.textPrimary }]}>SabiBot 🤖</Text>
              <Text style={[styles.scoreValue, { color: '#D4A017' }]}>{botScore}</Text>
            </View>
          </View>

          {/* Round Indicator */}
          <View style={[styles.roundBadge, { backgroundColor: theme.brandSecondary }]}>
            <Text style={styles.roundBadgeText}>Round {roundIndex + 1}/5</Text>
          </View>
        </View>

        {/* Player Timer Track */}
        <View style={[styles.timerTrack, { backgroundColor: theme.bgSecondary }]}>
          <Animated.View style={[styles.timerFill, {
            backgroundColor: timeLeft > 15 ? theme.success : timeLeft > 8 ? theme.warning : theme.error,
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        {/* Arena Split Panel */}
        <View style={styles.arenaSplitArea}>
          
          {/* Player Arena Section */}
          <View style={[styles.sidePanel, styles.leftSide]}>
            <View style={styles.avatarHolder}>
              <AjalaAvatar state={ajalaState} size={54} triggerCorrect={ajalaCorrect} triggerWrong={ajalaWrong} />
              <Text style={[styles.avatarLabel, { color: theme.textSecondary }]}>You</Text>
            </View>

            {/* Answer indicators */}
            <View style={styles.pipsRow}>
              {Array.from({ length: 5 }).map((_, i) => {
                const completed = i < roundIndex || (i === roundIndex && playerAnswerStatus !== 'idle');
                const isCorrect = i === roundIndex
                  ? (playerAnswerStatus === 'submitted_correct')
                  : (i < roundIndex && matchWords[i] ? true : false); // Mocking past results on index
                // Note: accurate status can be deduced from round score, keeping it simple for UI pips
                return (
                  <View key={i} style={[
                    styles.pip,
                    !completed && { backgroundColor: theme.bgSecondary },
                    completed && isCorrect && { backgroundColor: theme.success },
                    completed && !isCorrect && { backgroundColor: theme.error }
                  ]} />
                );
              })}
            </View>
          </View>

          {/* SabiBot Arena Section */}
          <View style={[styles.sidePanel, styles.rightSide, { borderLeftColor: theme.divider }]}>
            <View style={styles.avatarHolder}>
              <View style={styles.botAvatarBadge}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
              <Text style={[styles.avatarLabel, { color: theme.textSecondary }]}>SabiBot</Text>
            </View>

            {/* Thinking Progress / Submission Status */}
            <View style={styles.botStatusContainer}>
              {botStatus === 'thinking' ? (
                <View style={styles.botProgressTrack}>
                  <View style={[styles.botProgressFill, { width: `${botProgress * 100}%` }]} />
                  <Text style={styles.botProgressText}>Thinking...</Text>
                </View>
              ) : (
                <View style={[
                  styles.botResultBadge,
                  { backgroundColor: botStatus === 'submitted_correct' ? theme.success + '20' : theme.error + '20' }
                ]}>
                  <Text style={[
                    styles.botResultText,
                    { color: botStatus === 'submitted_correct' ? theme.success : theme.error }
                  ]}>
                    {botStatus === 'submitted_correct' ? 'Spelled! ✓' : 'Incorrect ✗'}
                  </Text>
                </View>
              )}
            </View>

            {/* Answer indicators for Bot */}
            <View style={styles.pipsRow}>
              {Array.from({ length: 5 }).map((_, i) => {
                const completed = i < botHistory.length;
                const isCorrect = botHistory[i];
                return (
                  <View key={i} style={[
                    styles.pip,
                    !completed && { backgroundColor: theme.bgSecondary },
                    completed && isCorrect && { backgroundColor: theme.success },
                    completed && !isCorrect && { backgroundColor: theme.error }
                  ]} />
                );
              })}
            </View>
          </View>

        </View>

        {/* Wordbank Dashes Area */}
        <View style={styles.wordDisplayArea}>
          <Text style={[styles.wordDashesLabel, { color: theme.textMuted }]}>Type what you hear:</Text>
          <View style={styles.charSlotsContainer}>
            {activeWord.text.split('').map((char, index) => {
              if (char === ' ') return <View key={index} style={styles.charSlotSpace} />;
              if (char === '-') {
                return (
                  <View key={index} style={styles.charSlotSpecial}>
                    <Text style={[styles.charSlotText, { color: theme.textPrimary }]}>-</Text>
                  </View>
                );
              }

              const displayChar = playerAnswerStatus === 'submitted_correct'
                ? char.toUpperCase()
                : (userInput[index] || '');

              const isActive = playerAnswerStatus === 'idle' && userInput.length === index;
              const isFilled = !!userInput[index];
              const isLongWord = activeWord.text.length > 8;

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

          {/* Context definition display */}
          <View style={[styles.definitionCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.defText, { color: theme.textSecondary }]}>"{activeWord.definition}"</Text>
          </View>

          {/* Reveal feedback if player answered wrong */}
          {playerAnswerStatus === 'submitted_wrong' && (
            <View style={styles.wrongSpellingReveal}>
              <Text style={{ color: theme.textMuted, fontSize: FontSizes.xs }}>CORRECT SPELLING:</Text>
              <Text style={[styles.correctRevealText, { color: theme.success }]}>{activeWord.text.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Bottom Actions Area */}
        <View style={styles.bottomArea}>
          {playerAnswerStatus === 'idle' ? (
            <View style={styles.actionRow}>
              <TouchableOpacity id="arena-speak-btn" onPress={() => speak(activeWord.text, 'en', 0.85, undefined, activeWord.id)}
                style={[styles.actionBtn, { borderColor: theme.border, flex: 0, width: 80 }]}>
                <Text style={{ fontSize: 20 }}>🔊</Text>
              </TouchableOpacity>

              <SpellingKeyboard
                onKeyPress={handleKeyboardPress}
                onDelete={handleKeyboardDelete}
                onSubmit={handleSubmit}
                disabled={playerAnswerStatus !== 'idle'}
                theme={theme}
              />
            </View>
          ) : (
            <View style={[styles.roundResultPanel, { backgroundColor: theme.bgCard, borderTopColor: theme.divider }]}>
              {roundDone ? (
                <TouchableOpacity
                  id="arena-next-btn"
                  onPress={handleNextWord}
                  style={[styles.nextButton, { backgroundColor: theme.brandPrimary }]}
                >
                  <Text style={styles.nextButtonText}>
                    {roundIndex + 1 >= 5 ? 'View Results 📊' : 'Next Round ➡️'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.waitingContainer}>
                  <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                    {botThinking ? '🤖 Waiting for SabiBot to submit...' : 'Waiting to advance...'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

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
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>Exit Arena?</Text>
              <Text style={[styles.modalMessageText, { color: theme.textSecondary }]}>
                Quitting now counts as a forfeit. Your Arena rating (SSR) will decrease and you will lose progress.
              </Text>
              <View style={styles.modalActionsRow}>
                <TouchableOpacity onPress={() => setShowExitConfirmation(false)} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Keep Playing</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowExitConfirmation(false); router.back(); }} style={[styles.modalConfirmBtn, { backgroundColor: theme.error }]}>
                  <Text style={styles.modalConfirmText}>Yes, Quit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Match Results (Podium) Modal */}
        <Modal
          visible={showResultsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowResultsModal(false)}
        >
          <View style={styles.resultsOverlay}>
            <View style={[styles.resultsCard, Shadows.modal]}>
              <Text style={styles.resultsEmoji}>
                {playerScore > botScore ? '🏆' : playerScore < botScore ? '😭' : '🤝'}
              </Text>
              <Text style={[styles.resultsTitle, { color: theme.textPrimary }]}>
                {playerScore > botScore ? 'Victory!' : playerScore < botScore ? 'Defeat!' : "It's a Draw!"}
              </Text>

              <View style={[styles.scoreSummaryCard, { backgroundColor: theme.bgSecondary }]}>
                <View style={styles.summaryCol}>
                  <Text style={[styles.summaryName, { color: theme.textPrimary }]}>You</Text>
                  <Text style={[styles.summaryScore, { color: theme.brandPrimary }]}>{playerScore}/5</Text>
                  <Text style={[styles.summaryDelta, { color: playerSsrDelta >= 0 ? theme.success : theme.error }]}>
                    {playerSsrDelta >= 0 ? `+${playerSsrDelta}` : playerSsrDelta} SSR
                  </Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={[styles.summaryName, { color: theme.textPrimary }]}>SabiBot</Text>
                  <Text style={[styles.summaryScore, { color: '#D4A017' }]}>{botScore}/5</Text>
                  <Text style={[styles.summaryDelta, { color: botSsrDelta >= 0 ? theme.success : theme.error }]}>
                    {botSsrDelta >= 0 ? `+${botSsrDelta}` : botSsrDelta} SSR
                  </Text>
                </View>
              </View>

              {/* Earned Rewards */}
              <View style={styles.earnedRewardsContainer}>
                <Text style={[styles.rewardsTitle, { color: theme.textMuted }]}>REWARDS EARNED</Text>
                <View style={styles.rewardsRow}>
                  <View style={[styles.rewardBadge, { backgroundColor: '#E8F8EF' }]}>
                    <Text style={[styles.rewardText, { color: theme.success }]}>+{xpReward} XP</Text>
                  </View>
                  <View style={[styles.rewardBadge, { backgroundColor: '#FFF9E6' }]}>
                    <Text style={[styles.rewardText, { color: '#F5A623' }]}>+{coinReward} 🪙</Text>
                  </View>
                </View>
              </View>

              {/* CTAs */}
              <View style={styles.resultsActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowResultsModal(false);
                    initArenaMatch();
                  }}
                  style={[styles.ctaButton, { backgroundColor: theme.brandPrimary }]}
                >
                  <Text style={styles.ctaButtonText}>Play Again ⚔️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowResultsModal(false);
                    router.replace('/dashboard' as any);
                  }}
                  style={[styles.ctaButton, { borderColor: theme.border, borderWidth: 2, backgroundColor: '#FFFFFF', marginTop: 10 }]}
                >
                  <Text style={[styles.ctaButtonText, { color: theme.textSecondary }]}>Return Home 🏠</Text>
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
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FontSizes.md, fontFamily: FontFamily.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  closeBtn: {
    fontSize: FontSizes.xl,
    width: 36,
    textAlign: 'center',
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
  scoreValue: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
  },
  scoreDivider: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.mono,
    fontWeight: 'bold',
  },
  roundBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  roundBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.headingRegular,
    fontWeight: 'bold',
  },
  timerTrack: {
    height: 5,
    marginHorizontal: Spacing.base,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  arenaSplitArea: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    height: 100,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C4DCF4',
    overflow: 'hidden',
  },
  sidePanel: {
    flex: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSide: {},
  rightSide: {
    borderLeftWidth: 1.5,
  },
  avatarHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  avatarLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
  botAvatarBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFBF0',
    borderWidth: 1.5,
    borderColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarText: {
    fontSize: 22,
  },
  pipsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  botStatusContainer: {
    height: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  botProgressTrack: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#D4A017',
  },
  botProgressText: {
    fontSize: 8,
    fontFamily: FontFamily.bodySemiBold,
    color: '#333333',
    zIndex: 1,
  },
  botResultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  botResultText: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
  },
  wordDisplayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  wordDashesLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    marginBottom: Spacing.xs,
  },
  charSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  charSlot: {
    width: 32,
    height: 42,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charSlotSmall: {
    width: 24,
    height: 34,
  },
  charSlotSpace: {
    width: 8,
    height: 34,
  },
  charSlotSpecial: {
    width: 12,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charSlotActive: {
    borderWidth: 2,
  },
  charSlotFilled: {
    borderWidth: 2,
  },
  charSlotText: {
    fontSize: 18,
    fontFamily: FontFamily.heading,
    fontWeight: 'bold',
  },
  charSlotTextSmall: {
    fontSize: 13,
  },
  definitionCard: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    alignItems: 'center',
  },
  defText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyMedium,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wrongSpellingReveal: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  correctRevealText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.mono,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  bottomArea: {
    paddingBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  roundResultPanel: {
    height: 120,
    borderTopWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  nextButton: {
    height: 50,
    width: '100%',
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
  waitingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
  },
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
  },
  modalConfirmText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    color: '#FFFFFF',
  },
  resultsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 55, 115, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultsCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C4DCF4',
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  resultsTitle: {
    fontSize: FontSizes.xxl,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.md,
  },
  scoreSummaryCard: {
    flexDirection: 'row',
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryName: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 4,
  },
  summaryScore: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    marginBottom: 2,
  },
  summaryDelta: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.mono,
    fontWeight: 'bold',
  },
  earnedRewardsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  rewardsTitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.sm,
  },
  rewardText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
  },
  resultsActions: {
    width: '100%',
  },
  ctaButton: {
    height: 48,
    width: '100%',
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    color: '#FFFFFF',
  },
});
