import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';
import { AppConfig } from '../src/constants/AppConfig';

// ─── Mode card definitions ─────────────────────────────────────────────────
interface ModeCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  energyCost: number;
  route: string;
  themeAccent: string;
  available: boolean;
  comingSoon?: boolean;
}

const MODES: ModeCard[] = [
  {
    id: 'academic',
    emoji: '📚',
    title: 'Academic League',
    subtitle: 'SSS 2 · WAEC Prep',
    description: 'Spell advanced WAEC-relevant words. Adaptive difficulty powered by your personal ELO rating.',
    energyCost: AppConfig.ENERGY_COST_ACADEMIC,
    route: '/game/academic',
    themeAccent: '#0A6EBD',
    available: true,
  },
  {
    id: 'wazobia',
    emoji: '🥁',
    title: 'Wazobia Mode',
    subtitle: 'Yoruba · Igbo · Hausa',
    description: 'Spell Yoruba words with tone marks. Gangan drum feedback. Proverbs after each correct answer.',
    energyCost: AppConfig.ENERGY_COST_WAZOBIA,
    route: '/game/wazobia',
    themeAccent: '#C1440E',
    available: true,
    comingSoon: false,
  },
  {
    id: 'arena',
    emoji: '⚔️',
    title: 'Spell Arena',
    subtitle: 'vs SabiBot 🤖',
    description: 'Race against SabiBot in real time. High stakes — same word list, first to 5 wins.',
    energyCost: AppConfig.ENERGY_COST_ARENA,
    route: '/game/arena',
    themeAccent: '#D4A017',
    available: true,
    comingSoon: false,
  },
  {
    id: 'sandbox',
    emoji: '🔬',
    title: 'Sandbox',
    subtitle: 'Practice Mode',
    description: 'Drill words at your own pace with no timer and unlimited hints. Coming soon.',
    energyCost: 0,
    route: '',
    themeAccent: '#9E9E9E',
    available: false,
    comingSoon: true,
  },
  {
    id: 'review',
    emoji: '📖',
    title: 'Review Mode',
    subtitle: 'Past Mistakes',
    description: 'Revisit words you got wrong and reinforce your weak spots. Coming soon.',
    energyCost: 0,
    route: '',
    themeAccent: '#9E9E9E',
    available: false,
    comingSoon: true,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function ModeSelectScreen() {
  const router = useRouter();
  const theme = Themes.sss;
  const { energy, deductEnergy } = useProfileStore();
  const [pressing, setPressing] = useState<string | null>(null);

  const handleModePress = (mode: ModeCard) => {
    if (!mode.available || mode.comingSoon) {
      Alert.alert('Coming Soon!', `${mode.title} is being added in the next update. Stay tuned! 🚀`, [{ text: 'OK' }]);
      return;
    }

    // Check energy
    if (energy < mode.energyCost) {
      Alert.alert(
        'Out of Energy! ⚡',
        `You need ${mode.energyCost} energy pip${mode.energyCost > 1 ? 's' : ''} to play ${mode.title}. Energy refills 1 pip every 15 minutes.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Deduct energy and navigate
    const success = deductEnergy(mode.energyCost);
    if (success) {
      router.push(mode.route as any);
    } else {
      Alert.alert('Out of Energy! ⚡', 'Not enough energy. Wait for a refill or use Demo Controls.', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} id="mode-select-back-btn">
          <Text style={[styles.backText, { color: theme.brandPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Choose Mode</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            ⚡ {energy} energy available
          </Text>
        </View>
        {/* Placeholder to balance the flex layout */}
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {MODES.map((mode) => {
          const isDisabled = !mode.available || mode.comingSoon;
          const hasEnergy = energy >= mode.energyCost;
          const isPressing = pressing === mode.id;

          return (
            <TouchableOpacity
              key={mode.id}
              id={`mode-card-${mode.id}`}
              activeOpacity={isDisabled ? 1 : 0.88}
              onPressIn={() => !isDisabled && setPressing(mode.id)}
              onPressOut={() => setPressing(null)}
              onPress={() => handleModePress(mode)}
              style={[
                styles.modeCard,
                Shadows.card,
                {
                  borderLeftColor: mode.themeAccent,
                  opacity: isDisabled ? 0.55 : 1,
                  transform: [{ scale: isPressing ? 0.985 : 1 }],
                },
              ]}
            >
              {/* Coming Soon ribbon */}
              {mode.comingSoon && (
                <View style={[styles.comingSoonBadge, { backgroundColor: theme.bgSecondary }]}>
                  <Text style={[styles.comingSoonText, { color: theme.textMuted }]}>COMING SOON</Text>
                </View>
              )}

              {/* Card Header Row */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.emojiContainer, { backgroundColor: mode.themeAccent + '18' }]}>
                  <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                </View>

                <View style={styles.cardTitleBlock}>
                  <Text style={[styles.modeTitle, { color: isDisabled ? theme.textMuted : theme.textPrimary }]}>
                    {mode.title}
                  </Text>
                  <Text style={[styles.modeSubtitle, { color: theme.textMuted }]}>
                    {mode.subtitle}
                  </Text>
                </View>

                {/* Energy Cost Badge */}
                {!mode.comingSoon && mode.energyCost > 0 && (
                  <View style={[
                    styles.energyCostBadge,
                    {
                      backgroundColor: hasEnergy ? mode.themeAccent + '18' : '#FFEAEA',
                      borderColor: hasEnergy ? mode.themeAccent : '#D93025',
                    }
                  ]}>
                    <Text style={[
                      styles.energyCostText,
                      { color: hasEnergy ? mode.themeAccent : '#D93025' }
                    ]}>
                      ⚡ {mode.energyCost}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                {mode.description}
              </Text>

              {/* Play CTA — only for available modes */}
              {!isDisabled && (
                <View style={styles.cardFooter}>
                  <View style={[styles.playCTA, { backgroundColor: mode.themeAccent }]}>
                    <Text style={styles.playCTAText}>Play →</Text>
                  </View>
                  {!hasEnergy && (
                    <Text style={[styles.noEnergyHint, { color: theme.error }]}>
                      Need {mode.energyCost} ⚡ to play
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Bottom breathing room */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10, 110, 189, 0.08)',
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.bodySemiBold,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
  },
  headerSub: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    marginTop: 2,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  modeCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.lg,
    borderLeftWidth: 5,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  comingSoonText: {
    fontSize: 9,
    fontFamily: FontFamily.bodySemiBold,
    letterSpacing: 0.8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  modeEmoji: {
    fontSize: 24,
  },
  cardTitleBlock: {
    flex: 1,
  },
  modeTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
  energyCostBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  energyCostText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
  },
  modeDesc: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    lineHeight: FontSizes.sm * 1.5,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    justifyContent: 'space-between',
  },
  playCTA: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCTAText: {
    color: GlobalColors.white,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingSemi,
    letterSpacing: 0.5,
  },
  noEnergyHint: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodyMedium,
  },
});
