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
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';
import { AppConfig, getXPTitle, getNextTitleXP } from '../src/constants/AppConfig';
import { initBGM, toggleBGM, isBGMEnabled } from '../src/services/bgm';
import { DEMO_LEADERBOARD_SSS2, insertLiveUser } from '../src/constants/DemoSeeds';

const ajalaStandardImg = require('../assets/images/ajala_standard.png');

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

  // XP Calculations for compact Status Hub Row
  const currentTitleObj = [...AppConfig.XP_TITLES]
    .reverse()
    .find((t) => xp >= t.minXP) || AppConfig.XP_TITLES[0];
  const nextTitleObj = AppConfig.XP_TITLES.find((t) => t.minXP > xp);

  let progressFraction = 1.0;
  if (nextTitleObj) {
    const range = nextTitleObj.minXP - currentTitleObj.minXP;
    progressFraction = range > 0 ? (xp - currentTitleObj.minXP) / range : 0;
  }

  const dashboardXPProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dashboardXPProgress, {
      toValue: progressFraction,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progressFraction]);

  const cap = AppConfig.ENERGY_CAP;
  const energyPips = [];
  for (let i = 0; i < cap; i++) {
    energyPips.push(i < energy);
  }

  // Trigger energy refill check on load
  useEffect(() => {
    checkAndRefillEnergy();
    
    // Initialize background music loop and sync state
    initBGM().then(() => {
      setBgmMuted(!isBGMEnabled());
    });

    // Set an interval to check energy refill every 30 seconds while on the dashboard
    const interval = setInterval(() => {
      checkAndRefillEnergy();
    }, 30000);
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
          {/* Circular Profile Avatar Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/profile')}
            style={styles.profileHUDButton}
          >
            <View style={[styles.headerAvatarWrap, { borderColor: theme.brandAccent }]}>
              <Image source={ajalaStandardImg} style={styles.headerAvatar} />
            </View>
            <Text style={[styles.headerProfileLabel, { color: theme.textPrimary }]}>Profile 👤</Text>
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
            <TouchableOpacity
              id="dashboard-coins-btn"
              activeOpacity={0.7}
              onPress={() => router.push('/shop')}
            >
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
            </TouchableOpacity>
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

        {/* Scholar Status Hub Card */}
        <View style={[styles.statusHubCard, Shadows.card]}>
          {/* Energy Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusLabelWrap}>
              <Text style={styles.statusIcon}>⚡</Text>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>ENERGY</Text>
            </View>
            <View style={styles.pipsRow}>
              {energyPips.map((active, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pip,
                    {
                      backgroundColor: active ? theme.energyFill : 'rgba(196, 220, 244, 0.2)',
                      borderColor: active ? theme.brandPrimary : 'rgba(196, 220, 244, 0.4)',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.statusValueText, { color: theme.textPrimary }]}>
              {energy}/{cap}
            </Text>
          </View>

          {/* Horizontal Divider */}
          <View style={styles.statusDivider} />

          {/* XP Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusLabelWrap}>
              <Text style={styles.statusIcon}>🏆</Text>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{currentTitleObj.title.toUpperCase()}</Text>
            </View>
            <View style={styles.xpTrackWrap}>
              <View style={[styles.xpTrack, { backgroundColor: theme.xpTrack }]}>
                <Animated.View
                  style={[
                    styles.xpFill,
                    {
                      backgroundColor: theme.xpFill,
                      width: dashboardXPProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.statusValueText, { color: theme.textPrimary }]}>
              {Math.round(progressFraction * 100)}%
            </Text>
          </View>

          {/* Energy Refill Footer (Only show when energy < cap) */}
          {energy < cap && (
            <Text style={styles.refillInfoText}>
              ⚡ Energy refills 1 pip every 15 minutes offline
            </Text>
          )}
        </View>

        {/* Daily Challenge Card */}
        <TouchableOpacity
          id="dashboard-challenge-btn"
          activeOpacity={0.85}
          onPress={handleModeSelect}
          style={[styles.challengeCard, Shadows.elevated, { backgroundColor: theme.brandSecondary }]}
        >
          <View style={styles.challengeHeader}>
            <View style={[styles.challengeBadge, { backgroundColor: theme.brandAccent }]}>
              <Text style={styles.challengeBadgeText}>DAILY CHALLENGE</Text>
            </View>
            <Text style={styles.challengeReward}>🎁 +50 Coins • +100 XP</Text>
          </View>
          <Text style={styles.challengeTitle}>WAEC Prep Mastery</Text>
          <Text style={styles.challengeDesc}>Spell 5 words correctly in a row in the SSS 2 Academic League.</Text>
        </TouchableOpacity>



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

        {/* Navigation Grid (Leaderboard & Sabi Shop) */}
        <View style={styles.navGrid}>
          {/* Leaderboard CTA */}
          <TouchableOpacity
            id="dashboard-leaderboard-btn"
            activeOpacity={0.85}
            onPress={() => router.push('/leaderboard')}
            style={[styles.gridCard, { borderLeftColor: '#0A6EBD' }, Shadows.card]}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(10, 110, 189, 0.1)' }]}>
              <Text style={styles.gridIcon}>📊</Text>
            </View>
            <Text style={[styles.gridTitle, { color: theme.textPrimary }]}>Leaderboard</Text>
            <Text style={[styles.gridSub, { color: theme.textSecondary }]}>Rank #{liveUserRank}</Text>
          </TouchableOpacity>

          {/* Sabi Shop CTA */}
          <TouchableOpacity
            id="dashboard-shop-btn"
            activeOpacity={0.85}
            onPress={() => router.push('/shop')}
            style={[styles.gridCard, { borderLeftColor: '#F5A623' }, Shadows.card]}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(245, 166, 35, 0.1)' }]}>
              <Text style={styles.gridIcon}>🛍️</Text>
            </View>
            <Text style={[styles.gridTitle, { color: theme.textPrimary }]}>Sabi Shop</Text>
            <Text style={[styles.gridSub, { color: theme.textSecondary }]}>Buy Exam Packs</Text>
          </TouchableOpacity>
        </View>

        {/* Mascot Greeting */}
        <View style={styles.mascotSpeechSection}>
          <View style={[styles.speechBubble, Shadows.card]}>
            <View style={styles.speechBubbleTail} />
            <Text style={[styles.speechText, { color: theme.textPrimary }]}>
              Ẹ n lẹ́, <Text style={styles.boldText}>{username}</Text>! Ready to climb the spelling rankings and unlock graduation today? 🎓
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogoPress}
            style={[styles.mascotBadge, { backgroundColor: theme.bgSecondary, borderColor: theme.brandAccent }]}
          >
            <Image source={ajalaStandardImg} style={styles.ajalaMascot} resizeMode="contain" />
          </TouchableOpacity>
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
  profileMetaBtn: {
    justifyContent: 'center',
  },
  profileHUDButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: Spacing.sm,
  },
  headerAvatar: {
    width: 24,
    height: 24,
  },
  headerProfileLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    letterSpacing: 0.1,
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
  statusHubCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '32%',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
    letterSpacing: 1.0,
  },
  pipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pip: {
    width: 14,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.2,
    marginHorizontal: 3,
  },
  statusValueText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    width: '12%',
    textAlign: 'right',
  },
  statusDivider: {
    height: 1,
    backgroundColor: 'rgba(10, 110, 189, 0.08)',
    marginVertical: Spacing.sm,
  },
  xpTrackWrap: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  xpTrack: {
    height: 10,
    borderRadius: Radii.round,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  xpFill: {
    height: '100%',
    borderRadius: Radii.round,
  },
  refillInfoText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    color: '#7A94B0',
    marginTop: Spacing.sm,
    textAlign: 'center',
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
  navGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  gridCard: {
    width: '48%',
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.12)',
    borderLeftWidth: 5,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  gridIcon: {
    fontSize: 20,
  },
  gridTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    marginBottom: 2,
  },
  gridSub: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
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
    marginRight: Spacing.lg,
    borderBottomRightRadius: 0,
    position: 'relative',
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: 12,
    right: -6,
    width: 12,
    height: 12,
    backgroundColor: GlobalColors.white,
    transform: [{ rotate: '45deg' }],
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
