import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Animated, Share, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import { useGameStore } from '../src/store/gameStore';
import AjalaAvatar, { AjalaState } from '../src/components/AjalaAvatar';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';

// Animated count-up hook
function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, durationMs]);
  return value;
}

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme  = Themes.sss;

  const { username, xp, academic_ssr, daily_streak } = useProfileStore();
  const { sessionScore, sessionWords, spellStreak, sessionHistory } = useGameStore();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const wordsPlayed  = Math.max(sessionWords.length, 1);
  const correctCount = sessionScore;

  // Estimate per-session XP and coins (base: SSR ~1100–1200 range)
  const estimatedXP    = correctCount * 22;
  const estimatedCoins = correctCount * 11;

  const xpDisplay   = useCountUp(estimatedXP,    1400);
  const coinDisplay = useCountUp(estimatedCoins, 1100);

  const [ajalaState, setAjalaState] = useState<AjalaState>('standard');
  const cardSlide = useRef(new Animated.Value(36)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.timing(cardFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    if (correctCount >= 4) {
      setAjalaState('graduation');
      setTimeout(() => setAjalaState('standard'), 2000);
    } else if (correctCount <= 2) {
      setAjalaState('sandbox');
    }
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just scored ${correctCount}/${wordsPlayed} in SabiSpell and earned ${estimatedXP} XP! 🎓\nNigeria's #1 adaptive spelling app for SSS students. Download it and challenge me! 🔥`,
      });
    } catch (_) {}
  };

  const grade =
    correctCount === 5 ? { label: 'Perfect! 🌟',    color: '#27AE60' }
    : correctCount >= 4 ? { label: 'Excellent! ✅', color: '#27AE60' }
    : correctCount >= 3 ? { label: 'Good Job 👍',   color: theme.brandPrimary }
    : correctCount >= 2 ? { label: 'Keep Trying 💪',color: theme.warning }
    :                     { label: 'Chin Up! 🙌',   color: theme.error };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <AjalaAvatar state={ajalaState} size={88} />
        </View>

        {/* Grade banner */}
        <Animated.View style={[styles.gradeBanner,
          { backgroundColor: grade.color + '18', borderColor: grade.color + '40', opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <Text style={[styles.gradeText,  { color: grade.color         }]}>{grade.label}</Text>
          <Text style={[styles.gradeScore, { color: theme.textPrimary   }]}>{correctCount} / {wordsPlayed} words correct</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View style={[styles.statsRow, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          {[
            { emoji: '⚡', value: `+${xpDisplay}`,   label: 'XP Earned', color: '#27AE60' },
            { emoji: '🪙', value: `+${coinDisplay}`,  label: 'Coins',     color: '#D48806' },
            { emoji: '🔥', value: `${daily_streak}d`, label: 'Streak',    color: '#FF6B35' },
          ].map(({ emoji, value, label, color }) => (
            <View key={label} style={[styles.statCard, Shadows.card]}>
              <Text style={styles.statEmoji}>{emoji}</Text>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* SSR delta card */}
        <Animated.View style={[styles.ssrCard, Shadows.card, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.ssrRow}>
            <Text style={[styles.ssrLabel, { color: theme.textSecondary }]}>Your SSR Rating</Text>
            <View style={[styles.ssrBadge,
              { backgroundColor: correctCount >= 3 ? '#E8F8EF' : '#FFF0F0',
                borderColor:      correctCount >= 3 ? '#27AE60' : theme.error }]}>
              <Text style={[styles.ssrBadgeText, { color: correctCount >= 3 ? '#27AE60' : theme.error }]}>
                {correctCount >= 3 ? '↑ Rising' : '↓ Dropped'}
              </Text>
            </View>
          </View>
          <Text style={[styles.ssrValue, { color: theme.textPrimary }]}>{academic_ssr}</Text>
          <Text style={[styles.ssrSub,   { color: theme.textMuted   }]}>ELO-based rating · updates after each word</Text>
        </Animated.View>

        {/* Streak multiplier hint */}
        {spellStreak >= 3 && (
          <View style={[styles.streakBanner, { backgroundColor: '#FFEBE3', borderColor: '#FF6B35' }]}>
            <Text style={[styles.streakText, { color: '#FF6B35' }]}>
              🔥 {spellStreak}-word streak! Bonus multiplier active
            </Text>
          </View>
        )}

        {/* Mascot message */}
        <View style={[styles.mascotMsg, Shadows.card]}>
          <Text style={[styles.mascotText, { color: theme.textPrimary }]}>
            {correctCount >= 4
              ? `Ẹ kú ìjókòó, ${username}! 🎉 Outstanding — your SSR is climbing!`
              : correctCount >= 3
              ? `Good work, ${username}! Keep building that streak. 💪`
              : `Gbiyanju, ${username}! Every miss is a lesson. Come back stronger. 🌱`}
          </Text>
        </View>

        {/* Spelling Review Accordion */}
        {sessionHistory && sessionHistory.length > 0 && (
          <View style={{ width: '100%', marginBottom: Spacing.md }}>
            <TouchableOpacity
              id="result-breakdown-btn"
              onPress={() => setShowBreakdown(v => !v)}
              style={[styles.breakdownToggleBtn, { borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.breakdownToggleText, { color: theme.brandPrimary }]}>
                {showBreakdown ? 'Hide Spelling Review ▲' : 'View Spelling Review ▼'}
              </Text>
            </TouchableOpacity>

            {showBreakdown && (
              <View style={styles.breakdownList}>
                {sessionHistory.map((item, idx) => (
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
        )}
      </ScrollView>

      {/* Sticky bottom CTAs */}
      <View style={[styles.bottomBar, {
        paddingBottom: Math.max(insets.bottom, Spacing.base),
        backgroundColor: theme.bgPrimary + 'F2',
      }]}>
        <TouchableOpacity id="result-share-btn" onPress={handleShare}
          style={[styles.shareBtn, { borderColor: theme.brandPrimary }]} activeOpacity={0.8}>
          <Text style={[styles.shareBtnText, { color: theme.brandPrimary }]}>📤  Share My Score</Text>
        </TouchableOpacity>

        <View style={styles.ctaRow}>
          <TouchableOpacity id="result-play-again-btn" onPress={() => router.replace('/mode-select' as any)}
            style={[styles.ctaPrimary, { backgroundColor: theme.brandPrimary }, Shadows.button]} activeOpacity={0.85}>
            <Text style={styles.ctaPrimaryText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity id="result-home-btn" onPress={() => router.replace('/dashboard' as any)}
            style={[styles.ctaOutline, { borderColor: theme.brandPrimary }]} activeOpacity={0.8}>
            <Text style={[styles.ctaOutlineText, { color: theme.brandPrimary }]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  scroll:      { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, alignItems: 'center' },
  avatarRow:   { marginBottom: Spacing.md },
  gradeBanner: { width: '100%', borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1.5, marginBottom: Spacing.md },
  gradeText:   { fontSize: FontSizes.xl,  fontFamily: FontFamily.heading,     marginBottom: 4 },
  gradeScore:  { fontSize: FontSizes.md,  fontFamily: FontFamily.bodySemiBold },
  statsRow:    { flexDirection: 'row', width: '100%', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard:    { flex: 1, backgroundColor: GlobalColors.white, borderRadius: Radii.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statEmoji:   { fontSize: 22, marginBottom: 4 },
  statValue:   { fontSize: FontSizes.xl,  fontFamily: FontFamily.heading, marginBottom: 2 },
  statLabel:   { fontSize: FontSizes.xs,  fontFamily: FontFamily.body },
  ssrCard:     { width: '100%', backgroundColor: GlobalColors.white, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginBottom: Spacing.md },
  ssrRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  ssrLabel:    { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  ssrBadge:    { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.sm, borderWidth: 1 },
  ssrBadgeText:{ fontSize: FontSizes.xs, fontFamily: FontFamily.mono, fontWeight: '700' },
  ssrValue:    { fontSize: FontSizes.xxl, fontFamily: FontFamily.heading, marginBottom: 2 },
  ssrSub:      { fontSize: FontSizes.xs, fontFamily: FontFamily.body },
  streakBanner:{ width: '100%', borderRadius: Radii.md, padding: Spacing.sm, borderWidth: 1, alignItems: 'center', marginBottom: Spacing.md },
  streakText:  { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold },
  mascotMsg:   { width: '100%', backgroundColor: GlobalColors.white, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginBottom: Spacing.md },
  mascotText:  { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: FontSizes.sm * 1.6, textAlign: 'center' },
  bottomBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(10,110,189,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 8 },
  shareBtn:    { height: 44, borderRadius: Radii.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  shareBtnText:{ fontSize: FontSizes.sm, fontFamily: FontFamily.headingSemi },
  ctaRow:      { flexDirection: 'row', gap: Spacing.sm },
  ctaPrimary:  { flex: 1, height: 52, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  ctaPrimaryText: { color: GlobalColors.white, fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi },
  ctaOutline:  { flex: 1, height: 52, borderRadius: Radii.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ctaOutlineText: { fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi },
  breakdownToggleBtn: {
    width: '100%',
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  breakdownToggleText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingSemi,
  },
  breakdownList: {
    width: '100%',
    marginTop: Spacing.sm,
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
