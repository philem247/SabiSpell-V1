import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../src/store/profileStore';
import { EnergyBar } from '../src/components/EnergyBar';
import { XPBar } from '../src/components/XPBar';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';
import { AppConfig } from '../src/constants/AppConfig';

const ajalaStandardImg = require('../assets/images/ajala_standard.png');
const sabiSpellLogoImg = require('../assets/images/sabispell_logo.png');

export default function DashboardScreen() {
  const router = useRouter();

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
    deductEnergy,
    refillEnergy,
    addXPAndCoins,
    resetProfile,
  } = useProfileStore();

  // Hidden demo panel states
  const [logoTaps, setLogoTaps] = useState(0);
  const [demoPanelVisible, setDemoPanelVisible] = useState(false);

  // Trigger energy refill check on load
  useEffect(() => {
    checkAndRefillEnergy();
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
    // Academic League costs 1 energy
    const success = deductEnergy(AppConfig.ENERGY_COST_ACADEMIC);
    if (success) {
      router.push('/game/academic');
    } else {
      Alert.alert(
        'Out of Energy! ⚡',
        'You do not have enough energy to play. Tap the SabiSpell logo 5 times to access Demo Controls and refill, or wait for automatic refills.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleModeSelect = () => {
    router.push('/mode-select');
  };

  const theme = Themes.sss; // SSS Lagoon Blue theme

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]}>
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
            <View style={[styles.hudBadge, { backgroundColor: theme.bgSecondary }]}>
              <Text style={styles.hudBadgeText}>🔥 {daily_streak}d</Text>
            </View>
            {/* Coins */}
            <View style={[styles.hudBadge, { backgroundColor: theme.bgSecondary }]}>
              <Text style={styles.hudBadgeText}>🪙 {coins}</Text>
            </View>
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

        {/* Game Mode Selection Grid Title */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Choose Game Mode</Text>

        {/* Game Modes Grid */}
        <View style={styles.modeGrid}>
          {/* Mode 1: SSS 2 Academic League */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleModeSelect}
            style={[styles.modeCard, Shadows.card, { borderLeftColor: theme.brandPrimary, borderLeftWidth: 5 }]}
          >
            <View style={styles.modeCardHeader}>
              <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>Academic League</Text>
              <Text style={[styles.modeCostText, { color: theme.brandPrimary }]}>⚡ 1 Energy</Text>
            </View>
            <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
              Practice advanced WAEC-relevant spelling words. Adaptive difficulty.
            </Text>
          </TouchableOpacity>

          {/* Mode 2: Wazobia Mode */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleModeSelect}
            style={[styles.modeCard, Shadows.card, { borderLeftColor: Themes.wazobia.brandPrimary, borderLeftWidth: 5 }]}
          >
            <View style={styles.modeCardHeader}>
              <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>Wazobia Mode</Text>
              <Text style={[styles.modeCostText, { color: Themes.wazobia.brandPrimary }]}>⚡ 2 Energy</Text>
            </View>
            <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
              Learn Yoruba tone spelling with Ankara patterns, custom keyboard, and drum beats.
            </Text>
          </TouchableOpacity>

          {/* Mode 3: Spell Arena */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleModeSelect}
            style={[styles.modeCard, Shadows.card, { borderLeftColor: GlobalColors.sabiGold, borderLeftWidth: 5 }]}
          >
            <View style={styles.modeCardHeader}>
              <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>Spell Arena</Text>
              <Text style={[styles.modeCostText, { color: GlobalColors.sabiGold }]}>⚡ 2 Energy</Text>
            </View>
            <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
              Compete live in real time against SabiBot. High stakes.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mascot Mascot Greeting */}
        <View style={styles.mascotSpeechSection}>
          <View style={[styles.speechBubble, Shadows.card]}>
            <Text style={[styles.speechText, { color: theme.textPrimary }]}>
              Ẹ lẹ́yìn, <Text style={styles.boldText}>{username}</Text>! Ready to climb the spelling rankings and unlock graduation today? 🎓
            </Text>
          </View>
          <Image source={ajalaStandardImg} style={styles.ajalaMascot} resizeMode="contain" />
        </View>

        {/* Large Play Now CTA */}
        <TouchableOpacity
          onPress={handlePlayNow}
          activeOpacity={0.8}
          style={[styles.playButton, { backgroundColor: theme.brandPrimary }, Shadows.button]}
        >
          <Text style={styles.playButtonText}>Play SSS 2 Spell Round</Text>
        </TouchableOpacity>

      </ScrollView>

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
    paddingBottom: Spacing.xxl,
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
    fontFamily: FontFamily.headingSemi,
  },
  classText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
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
  },
  challengeCard: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  modeCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
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
  ajalaMascot: {
    width: 80,
    height: 80,
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
