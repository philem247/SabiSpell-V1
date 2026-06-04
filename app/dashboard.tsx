import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import { EnergyBar } from '../src/components/EnergyBar';
import { XPBar } from '../src/components/XPBar';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';
import { AppConfig } from '../src/constants/AppConfig';
import { initBGM, toggleBGM, isBGMEnabled } from '../src/services/bgm';
import { DEMO_LEADERBOARD_SSS2, insertLiveUser } from '../src/constants/DemoSeeds';

const ajalaStandardImg = require('../assets/images/ajala_standard.png');
const sabiSpellLogoImg = require('../assets/images/sabispell_logo.png');

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Load profile state
  const {
    username,
    coins,
    xp,
    daily_streak,
    energy,
    declaredClass,
    current_title,
    checkAndRefillEnergy,
    refillEnergy,
    addXPAndCoins,
    resetProfile,
  } = useProfileStore();

  // Hidden demo panel states
  const [logoTaps, setLogoTaps] = useState(0);
  const [demoPanelVisible, setDemoPanelVisible] = useState(false);

  // BGM preference state
  const [bgmMuted, setBgmMuted] = useState(true);

  // --- Animations ---
  // 1. Coin counter tick animation
  const [displayCoins, setDisplayCoins] = useState(coins);
  const animatedCoins = useRef(new Animated.Value(coins)).current;

  useEffect(() => {
    Animated.timing(animatedCoins, {
      toValue: coins,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [coins]);

  useEffect(() => {
    const listenerId = animatedCoins.addListener(({ value }) => {
      setDisplayCoins(Math.round(value));
    });
    return () => {
      animatedCoins.removeListener(listenerId);
    };
  }, [animatedCoins]);

  // 2. Coin badge pop-up scale animation
  const coinScale = useRef(new Animated.Value(1)).current;
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Pop scale from 1 -> 1.22 -> 1
    Animated.sequence([
      Animated.timing(coinScale, {
        toValue: 1.22,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(coinScale, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [coins]);

  // 3. Looping Streak Flame Badge pulse animation
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(streakScale, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(streakScale, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Calculate current rank for display
  const defaultUser = {
    username: username || 'Scholar',
    title: current_title || 'Scholar',
    xp: xp || 0,
  };
  const sss2Board = insertLiveUser(DEMO_LEADERBOARD_SSS2, defaultUser);
  const liveUserRow = sss2Board.find((e) => e.isLiveUser);
  const liveUserRank = liveUserRow ? liveUserRow.rank : 6;

  // Trigger energy refill check on load
  useEffect(() => {
    checkAndRefillEnergy();
    
    // Initialize background music loop and sync state
    initBGM().then(() => {
      setBgmMuted(!isBGMEnabled());
    });

    // Set an interval to check energy refill every 10 seconds while on the dashboard
    const interval = setInterval(() => {
      checkAndRefillEnergy();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoPress = () => {
    const nextTaps = logoTaps + 1;
    if (nextTaps >= AppConfig.DEMO_UNLOCK_TAP_COUNT) {
      setLogoTaps(0);
      setDemoPanelVisible(true);
    } else {
      setLogoTaps(nextTaps);
      // Auto reset count if no taps for 3 seconds
      const timer = setTimeout(() => setLogoTaps(0), 3000);
      return () => clearTimeout(timer);
    }
  };

  const handlePlayNow = () => {
    // Route to mode selection — energy is deducted on the mode select screen
    router.push('/mode-select' as any);
  };

  const handleModeSelect = () => {
    router.push('/mode-select' as any);
  };

  const handleGraduationExam = () => {
    router.push('/graduation' as any);
  };

  const theme = Themes.sss; // SSS Lagoon Blue theme

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header HUD Row */}
        <View style={styles.hudRow}>
          {/* Logo / Title (Tap 5 times for hidden panel) */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleLogoPress} style={styles.branding}>
            <Image source={sabiSpellLogoImg} style={styles.smallLogo} />
            <View>
              <Text style={[styles.usernameText, { color: theme.textPrimary }]}>{username || 'Scholar'}</Text>
              <Text style={[styles.classText, { color: theme.textSecondary }]}>{declaredClass}</Text>
            </View>
          </TouchableOpacity>

          {/* HUD Stats */}
          <View style={styles.statsHUD}>
            {/* Streak */}
            <Animated.View style={[
              styles.hudBadge,
              {
                backgroundColor: '#FFEBE3',
                borderColor: '#FF6B35',
                borderWidth: 1,
                transform: [{ scale: streakScale }],
              }
            ]}>
              <Text style={[styles.hudBadgeText, { color: '#FF6B35' }]}>🔥 {daily_streak}d</Text>
            </Animated.View>
            {/* Coins */}
            <Animated.View style={[
              styles.hudBadge,
              {
                backgroundColor: '#FFF5E6',
                borderColor: '#F5A623',
                borderWidth: 1,
                transform: [{ scale: coinScale }],
              }
            ]}>
              <Text style={[styles.hudBadgeText, { color: '#D48806' }]}>🪙 {displayCoins}</Text>
            </Animated.View>
            {/* BGM Toggle Badge */}
            <TouchableOpacity
              id="dashboard-bgm-btn"
              onPress={async () => {
                const isEnabled = await toggleBGM();
                setBgmMuted(!isEnabled);
              }}
              activeOpacity={0.7}
              style={[styles.hudBadge, { backgroundColor: '#E6F4FF', borderColor: theme.brandPrimary, borderWidth: 1 }]}
            >
              <Text style={[styles.hudBadgeText, { color: theme.brandPrimary }]}>
                {bgmMuted ? '🔇' : '🎵'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Energy Bar widget */}
        <View style={[styles.energyCard, Shadows.card]}>
          <EnergyBar energy={energy} themeKey="sss" />
          <Text style={styles.refillInfoText}>Refills 1 pip every 15 minutes offline</Text>
        </View>

        {/* XP Title Progress Bar Card */}
        <View style={[styles.xpCard, Shadows.card]}>
          <XPBar xp={xp} themeKey="sss" />
        </View>

        {/* Daily Challenge Card */}
        <View style={[styles.challengeCard, Shadows.elevated, { backgroundColor: theme.brandSecondary }]}>
          <View style={styles.challengeHeader}>
            <View style={[styles.challengeBadge, { backgroundColor: theme.brandAccent }]}>
              <Text style={styles.challengeBadgeText}>DAILY CHALLENGE</Text>
            </View>
            <Text style={styles.challengeReward}>🎁 +50 Coins • +100 XP</Text>
          </View>
          <Text style={styles.challengeTitle}>WAEC Prep Mastery</Text>
          <Text style={styles.challengeDesc}>Spell 5 words correctly in a row in the SSS 2 Academic League.</Text>
        </View>



        {/* Graduation Exam CTA */}
        <TouchableOpacity
          id="dashboard-graduation-btn"
          activeOpacity={0.88}
          onPress={handleGraduationExam}
          style={[styles.graduationCard, Shadows.card]}
        >
          <View style={styles.graduationCardInner}>
            <View style={styles.graduationIconWrap}>
              <Text style={styles.graduationIcon}>🎓</Text>
            </View>
            <View style={styles.graduationTextBlock}>
              <Text style={[styles.graduationTitle, { color: theme.textPrimary }]}>Graduation Exam</Text>
              <Text style={[styles.graduationSub, { color: theme.textSecondary }]}>
                SSS 2 Academic League · 20 words · 75% to pass
              </Text>
            </View>
            <Text style={[styles.graduationArrow, { color: theme.brandPrimary }]}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Leaderboard CTA */}
        <TouchableOpacity
          id="dashboard-leaderboard-btn"
          activeOpacity={0.88}
          onPress={() => router.push('/leaderboard')}
          style={[styles.leaderboardCard, Shadows.card]}
        >
          <View style={styles.leaderboardCardInner}>
            <View style={styles.leaderboardIconWrap}>
              <Text style={styles.leaderboardIcon}>📊</Text>
            </View>
            <View style={styles.leaderboardTextBlock}>
              <Text style={[styles.leaderboardTitle, { color: theme.textPrimary }]}>Weekly Leaderboard</Text>
              <Text style={[styles.leaderboardSub, { color: theme.textSecondary }]}>
                Rank #{liveUserRank} · Compete with classmates for MTN data!
              </Text>
            </View>
            <Text style={[styles.leaderboardArrow, { color: theme.brandPrimary }]}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Mascot Greeting */}
        <View style={styles.mascotSpeechSection}>
          <View style={[styles.speechBubble, Shadows.card]}>
            <Text style={[styles.speechText, { color: theme.textPrimary }]}>
              Ẹ lẹ́yìn, <Text style={styles.boldText}>{username}</Text>! Ready to climb the spelling rankings and unlock graduation today? 🎓
            </Text>
          </View>
          <View style={[styles.mascotBadge, { backgroundColor: theme.bgSecondary, borderColor: theme.brandAccent }]}>
            <Image source={ajalaStandardImg} style={styles.ajalaMascot} resizeMode="contain" />
          </View>
        </View>

      </ScrollView>

      {/* Floating Sticky Bottom CTA Container */}
      <View style={[styles.bottomCTAContainer, { backgroundColor: theme.bgPrimary + 'F0', paddingBottom: Math.max(insets.bottom, Spacing.base) }]}>
        <TouchableOpacity
          id="dashboard-play-btn"
          onPress={handlePlayNow}
          activeOpacity={0.85}
          style={[styles.playButton, { backgroundColor: theme.brandPrimary }, Shadows.button]}
        >
          <Text style={styles.playButtonText}>🎮  Choose Game Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Demo Controls Modal Panel */}
      <Modal
        visible={demoPanelVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDemoPanelVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.modal]}>
            <Text style={styles.modalTitle}>🛠️ Demo Controls Panel</Text>
            <Text style={styles.modalSubtitle}>Simulate different investor demo states instantly.</Text>

            {/* Controls */}
            <TouchableOpacity
              onPress={() => {
                refillEnergy();
                setDemoPanelVisible(false);
                Alert.alert('Success', 'Energy refilled to maximum cap!');
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Refill Energy (⚡ 5/5)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Set XP to 19,800 (right below Word Sage 20,000 threshold for live promotion demo)
                useProfileStore.setState({ xp: 19800, current_title: 'Scholar' });
                setDemoPanelVisible(false);
                Alert.alert('Success', 'XP set to 19,800 (midway to Word Sage)');
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Set XP to 19,800 (Promo Prep)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                resetProfile();
                setDemoPanelVisible(false);
                Alert.alert('Success', 'Profile seed values re-loaded!');
              }}
              style={[styles.modalButton, { backgroundColor: GlobalColors.sabiRed }]}
            >
              <Text style={styles.modalButtonText}>Reset to Default Demo Seed</Text>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity
              onPress={() => setDemoPanelVisible(false)}
              style={[styles.modalCloseButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.modalCloseButtonText, { color: theme.textSecondary }]}>Close Panel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 110, // Increased bottom padding to prevent bottom CTA overlapping content
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallLogo: {
    width: 42,
    height: 42,
    borderRadius: Radii.xs,
    marginRight: Spacing.sm,
  },
  usernameText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.heading,
    letterSpacing: 0.2,
  },
  classText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    opacity: 0.8,
    marginTop: 1,
  },
  statsHUD: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    marginLeft: Spacing.xs,
  },
  hudBadgeText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingRegular,
    fontWeight: 'bold',
  },
  energyCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  refillInfoText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    color: '#7A94B0',
    marginTop: Spacing.sm,
  },
  xpCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  challengeCard: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#FFEBE3',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  challengeBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  challengeBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.headingRegular,
    fontWeight: 'bold',
    color: '#1A0A00',
  },
  challengeReward: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    color: GlobalColors.white,
  },
  challengeTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
    color: GlobalColors.white,
  },
  challengeDesc: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    color: '#D4E6F7',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.headingSemi,
    marginBottom: Spacing.md,
  },
  modeGrid: {
    flexDirection: 'column',
    marginBottom: Spacing.md,
  },
  graduationCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.12)',
    borderLeftWidth: 5,
    borderLeftColor: '#F5A623',
  },
  graduationCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  graduationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  graduationIcon: {
    fontSize: 22,
  },
  graduationTextBlock: {
    flex: 1,
  },
  graduationTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    marginBottom: 2,
  },
  graduationSub: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
  },
  graduationArrow: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    marginLeft: Spacing.sm,
  },
  leaderboardCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.12)',
    borderLeftWidth: 5,
    borderLeftColor: '#0A6EBD',
  },
  leaderboardCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(10, 110, 189, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  leaderboardIcon: {
    fontSize: 22,
  },
  leaderboardTextBlock: {
    flex: 1,
  },
  leaderboardTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    marginBottom: 2,
  },
  leaderboardSub: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
  },
  leaderboardArrow: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    marginLeft: Spacing.sm,
  },
  modeCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modeTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
  },
  modeCostText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.mono,
  },
  modeDesc: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    lineHeight: FontSizes.sm * 1.3,
  },
  mascotSpeechSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderBottomRightRadius: 0,
  },
  speechText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.body,
    lineHeight: FontSizes.base * 1.3,
  },
  boldText: {
    fontFamily: FontFamily.bodySemiBold,
  },
  mascotBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalColors.white,
    // Add micro shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ajalaMascot: {
    width: 58,
    height: 58,
  },
  modeCostBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCTAContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10, 110, 189, 0.1)',
    // Shadow to lift the floating panel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  playButton: {
    height: 52,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: GlobalColors.white,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.lg,
    padding: 24,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
    color: GlobalColors.grey900,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    color: GlobalColors.grey600,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: '#0A6EBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: GlobalColors.white,
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
  modalCloseButton: {
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
});
