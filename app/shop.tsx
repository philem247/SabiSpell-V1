import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from '../src/store/profileStore';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';
import { initAudio, playCorrect, playCelebration } from '../src/services/audio';

interface PremiumPack {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
}

const PREMIUM_PACKS: PremiumPack[] = [
  {
    id: 'waec_10yr',
    name: '10-Year WAEC Past Questions',
    emoji: '📚',
    desc: 'Past exam spelling list',
    price: 1500,
  },
  {
    id: 'jamb_lit',
    name: 'JAMB Literature in English',
    emoji: '📖',
    desc: 'High-frequency book terms',
    price: 1200,
  },
  {
    id: 'post_utme',
    name: 'Post-UTME Vocabulary Booster',
    emoji: '⚡',
    desc: 'Advanced prep words',
    price: 1800,
  },
  {
    id: 'neco_prep',
    name: 'NECO National League Prep',
    emoji: '🏆',
    desc: 'Senior Certificate lists',
    price: 1000,
  },
  {
    id: 'spellbee_master',
    name: 'Senior School SpellBee Master',
    emoji: '🐝',
    desc: 'Champion-level lists',
    price: 1400,
  },
  {
    id: 'sat_ielts',
    name: 'SAT & IELTS High Frequency',
    emoji: '🌍',
    desc: 'Global exam vocab',
    price: 2500,
  },
];

const STORAGE_KEY_UNLOCKED = 'sabispell:unlocked_premium_packs';

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Themes.sss;

  // Store data
  const { coins, addXPAndCoins } = useProfileStore();

  // Screen states
  const [unlockedPacks, setUnlockedPacks] = useState<string[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [checkoutPack, setCheckoutPack] = useState<PremiumPack | null>(null);

  // Animated coins display HUD
  const [displayCoins, setDisplayCoins] = useState(coins);
  const animatedCoins = useRef(new Animated.Value(coins)).current;
  const coinScale = useRef(new Animated.Value(1)).current;
  const isFirstMount = useRef(true);

  // Load unlocked packs & initialize audio
  useEffect(() => {
    initAudio();
    loadUnlockedPacks();
  }, []);

  // Update animated coin ticker
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

  // Pop coin scale animation on increase
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(coinScale, {
        toValue: 1.25,
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

  const loadUnlockedPacks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_UNLOCKED);
      if (stored) {
        setUnlockedPacks(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load unlocked packs:', e);
    }
  };

  const handleWatchAd = () => {
    setAdLoading(true);
    // Simulate loading a sponsor video ad for 1.5 seconds
    setTimeout(() => {
      setAdLoading(false);
      addXPAndCoins(0, 5);
      playCorrect();
      Alert.alert('Sponsor Ad Completed', 'You earned +5 Sabi Coins! 🪙');
    }, 1500);
  };

  const handleBuyPack = (pack: PremiumPack) => {
    if (unlockedPacks.includes(pack.id)) {
      Alert.alert('Unlocked', `${pack.name} is already unlocked!`);
      return;
    }
    setCheckoutPack(pack);
  };

  const handleSimulateSuccess = async () => {
    if (!checkoutPack) return;

    try {
      const updatedList = [...unlockedPacks, checkoutPack.id];
      await AsyncStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(updatedList));
      setUnlockedPacks(updatedList);
      
      playCelebration();
      Alert.alert('Success', `Successfully unlocked ${checkoutPack.name}!`);
      setCheckoutPack(null);
    } catch (e) {
      console.warn('Failed to save unlocked pack:', e);
      Alert.alert('Error', 'An error occurred while saving the purchase.');
    }
  };

  const handleRestorePurchases = () => {
    Alert.alert('Restore Purchases', 'No past purchases found for this account.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Custom HUD Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.brandPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Sabi Shop 🛍️</Text>
        <Animated.View
          style={[
            styles.coinHUD,
            {
              transform: [{ scale: coinScale }],
            },
          ]}
        >
          <Text style={styles.coinHUDText}>🪙 {displayCoins}</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Coin shop and ads */}
        <View style={[styles.card, Shadows.card]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Coin Exchange</Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
            Earn more coins to play additional rounds of game modes.
          </Text>

          <View style={styles.coinDisplayRow}>
            <Text style={styles.largeCoinText}>🪙 {coins} Coins</Text>
            <Text style={[styles.coinBalanceLabel, { color: theme.textMuted }]}>Current Balance</Text>
          </View>

          <TouchableOpacity style={[styles.adButton, Shadows.button]} onPress={handleWatchAd}>
            <Text style={styles.adButtonText}>📺 Watch ad for +5 coins</Text>
          </TouchableOpacity>
        </View>

        {/* Premium question packs section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Premium Exam Packs</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Invest in your future with detailed syllabus-mapped past questions.
        </Text>

        <View style={styles.grid}>
          {PREMIUM_PACKS.map((pack) => {
            const isUnlocked = unlockedPacks.includes(pack.id);
            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packCard,
                  Shadows.card,
                  isUnlocked && styles.packCardUnlocked,
                ]}
                activeOpacity={0.8}
                onPress={() => handleBuyPack(pack)}
              >
                <View style={styles.packHeader}>
                  <Text style={styles.packEmoji}>{pack.emoji}</Text>
                  <Text style={styles.lockStatus}>{isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}</Text>
                </View>
                <Text style={[styles.packName, { color: theme.textPrimary }]}>{pack.name}</Text>
                <Text style={[styles.packDesc, { color: theme.textMuted }]}>{pack.desc}</Text>
                <View style={styles.packFooter}>
                  <Text style={styles.priceText}>₦{pack.price.toLocaleString()}</Text>
                  <View
                    style={[
                      styles.buyBadge,
                      { backgroundColor: isUnlocked ? '#E6F9F0' : theme.brandPrimary },
                    ]}
                  >
                    <Text style={[styles.buyBadgeText, { color: isUnlocked ? '#1DBF73' : '#FFFFFF' }]}>
                      {isUnlocked ? 'Ready' : 'Buy'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Restore purchases no-op */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
          <Text style={[styles.restoreText, { color: theme.textSecondary }]}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Simulated Ad Loading Overlay */}
      <Modal visible={adLoading} transparent={true} animationType="fade">
        <View style={styles.adOverlay}>
          <View style={[styles.adCard, Shadows.modal]}>
            <ActivityIndicator size="large" color={theme.brandPrimary} style={styles.spinner} />
            <Text style={styles.adTitle}>Loading Sponsor Ad...</Text>
            <Text style={styles.adSubtitle}>Please wait a moment to earn your Sabi Coins.</Text>
          </View>
        </View>
      </Modal>

      {/* Paystack Sandbox Checkout Modal */}
      <Modal
        visible={!!checkoutPack}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCheckoutPack(null)}
      >
        {checkoutPack && (
          <View style={styles.paystackOverlay}>
            <View style={[styles.paystackCard, Shadows.modal]}>
              {/* Header */}
              <View style={styles.paystackHeader}>
                <View>
                  <Text style={styles.paystackLogoText}>paystack</Text>
                  <Text style={styles.paystackSub}>SECURE PAYMENT GATEWAY</Text>
                </View>
                <View style={styles.sandboxBadge}>
                  <Text style={styles.sandboxBadgeText}>TEST / SANDBOX</Text>
                </View>
              </View>

              {/* Transaction details */}
              <View style={styles.paystackDetailBox}>
                <Text style={styles.paystackMerchant}>SabiSpell Premium Store</Text>
                <Text style={styles.paystackAmount}>₦{checkoutPack.price.toLocaleString()}.00</Text>
                <Text style={styles.paystackItem}>Purchasing: {checkoutPack.name}</Text>
              </View>

              {/* Paystack form simulation info */}
              <View style={styles.paystackForm}>
                <Text style={styles.formLabel}>Card Number</Text>
                <Text style={styles.formInput}>•••• •••• •••• 4081</Text>
                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: Spacing.sm }}>
                    <Text style={styles.formLabel}>Expiry Date</Text>
                    <Text style={styles.formInput}>12 / 28</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>CVV</Text>
                    <Text style={styles.formInput}>•••</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={styles.paystackButton}
                activeOpacity={0.8}
                onPress={handleSimulateSuccess}
              >
                <Text style={styles.paystackButtonText}>
                  Simulate Success (Unlock Pack)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paystackCancelButton}
                activeOpacity={0.8}
                onPress={() => setCheckoutPack(null)}
              >
                <Text style={styles.paystackCancelText}>Cancel / Decline Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10, 110, 189, 0.1)',
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
  },
  title: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
  },
  coinHUD: {
    backgroundColor: '#FFF5E6',
    borderColor: '#F5A623',
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
  },
  coinHUDText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingRegular,
    fontWeight: 'bold',
    color: '#D48806',
  },
  scrollContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    lineHeight: FontSizes.xs * 1.4,
    marginBottom: Spacing.md,
  },
  coinDisplayRow: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#EEF5FC',
    borderRadius: Radii.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  largeCoinText: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    color: '#D48806',
  },
  coinBalanceLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyMedium,
    marginTop: 2,
  },
  adButton: {
    backgroundColor: '#0A6EBD',
    height: 48,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adButtonText: {
    color: GlobalColors.white,
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.heading,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packCard: {
    width: '48%',
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
    justifyContent: 'space-between',
  },
  packCardUnlocked: {
    borderColor: 'rgba(29, 191, 115, 0.3)',
    borderWidth: 1.5,
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  packEmoji: {
    fontSize: 24,
  },
  lockStatus: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
    color: '#7A94B0',
  },
  packName: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingSemi,
    lineHeight: FontSizes.sm * 1.3,
    marginBottom: 4,
  },
  packDesc: {
    fontSize: 10,
    fontFamily: FontFamily.body,
    marginBottom: Spacing.sm,
    lineHeight: 13,
  },
  packFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  priceText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.mono,
    color: '#2A4A6E',
    fontWeight: 'bold',
  },
  buyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  buyBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.headingRegular,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  restoreText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    textDecorationLine: 'underline',
  },
  adOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  adCard: {
    width: '90%',
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  adTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  adSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    color: '#7A94B0',
    textAlign: 'center',
    lineHeight: 18,
  },
  paystackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  paystackCard: {
    backgroundColor: '#F9FAFC',
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  paystackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  paystackLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3ec08d',
  },
  paystackSub: {
    fontSize: 8,
    color: '#8CAECF',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  sandboxBadge: {
    backgroundColor: '#FFEBE3',
    borderColor: '#FF6B35',
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  sandboxBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.heading,
    color: '#FF6B35',
  },
  paystackDetailBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8F0',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  paystackMerchant: {
    fontSize: 11,
    fontFamily: FontFamily.bodyMedium,
    color: '#7A94B0',
    marginBottom: 4,
  },
  paystackAmount: {
    fontSize: 28,
    fontFamily: FontFamily.heading,
    color: '#0D1B2A',
    marginBottom: 4,
  },
  paystackItem: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    color: '#2A4A6E',
  },
  paystackForm: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
    color: '#7A94B0',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8F0',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.sm,
    color: '#0D1B2A',
    marginBottom: Spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paystackButton: {
    backgroundColor: '#3ec08d',
    height: 52,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paystackButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.md,
  },
  paystackCancelButton: {
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E6E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paystackCancelText: {
    color: '#E53935',
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
});
