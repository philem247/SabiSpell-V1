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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';
import { AppConfig, getXPTitle, getNextTitleXP } from '../src/constants/AppConfig';

const ajalaStandardImg = require('../assets/images/ajala_standard.png');

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Themes.sss;

  // Load profile state
  const {
    username,
    coins,
    xp,
    daily_streak,
    declaredClass,
    academic_ssr,
    wazobia_ssr,
    word_history,
    isGraduated,
    graduation_date,
  } = useProfileStore();

  // Screen states
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  // Animations
  const xpProgress = useRef(new Animated.Value(0)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

  // Resolve XP ranks
  const currentTitle = getXPTitle(xp);
  const nextXPThreshold = getNextTitleXP(xp);

  // Calculate XP progress percentage
  let xpPercent = 0;
  let xpRemaining = 0;
  if (nextXPThreshold !== null) {
    const titles = [...AppConfig.XP_TITLES];
    const currentTierMin = titles.find((t) => t.title === currentTitle)?.minXP ?? 0;
    const progressInTier = xp - currentTierMin;
    const tierRange = nextXPThreshold - currentTierMin;
    xpPercent = tierRange > 0 ? progressInTier / tierRange : 0;
    xpRemaining = nextXPThreshold - xp;
  } else {
    xpPercent = 1.0; // Max Rank achieved
  }

  // Count mastered words
  const wordsCompleted =
    (word_history?.sss?.length ?? 0) + (word_history?.yoruba?.length ?? 0);

  useEffect(() => {
    // XP bar fill animation
    Animated.timing(xpProgress, {
      toValue: xpPercent,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Streak flame pulsing loop
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(streakScale, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(streakScale, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [xpPercent]);

  const handleChangeClass = () => {
    Alert.alert(
      'Class Lockout',
      'Class changes are locked for 30 days (Demo Mode locks class selection).'
    );
  };

  const handleLinkAccount = () => {
    setSyncModalVisible(true);
  };

  const handleCreateSyncAccount = () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter a valid email and password.');
      return;
    }

    setSyncLoading(true);
    // Simulate API registration delay
    setTimeout(() => {
      setSyncLoading(false);
      setSyncModalVisible(false);
      Alert.alert(
        'Backend Coming Soon',
        'SabiSpell cloud synchronization is simulated in this prototype. Backend storage integration coming soon!'
      );
      setEmail('');
      setPassword('');
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header HUD */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.brandPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Scholar Profile 👤</Text>
        <View style={styles.coinHUD}>
          <Text style={styles.coinHUDText}>🪙 {coins}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={[styles.profileCard, Shadows.card]}>
          <View style={[styles.avatarOutline, { borderColor: theme.brandAccent }]}>
            <Image source={ajalaStandardImg} style={styles.avatarImage} />
          </View>

          <Text style={[styles.usernameText, { color: theme.textPrimary }]}>{username || 'Scholar'}</Text>
          <Text style={[styles.classTag, { color: theme.textSecondary }]}>
            🎓 {declaredClass} Student
          </Text>

          {/* Badge Display */}
          <View style={[styles.titleBadge, { backgroundColor: theme.brandPrimary }]}>
            <Text style={styles.titleBadgeText}>🎖️ {currentTitle}</Text>
          </View>
        </View>

        {/* XP Progression Card */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.xpHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>XP Progress</Text>
            <Text style={[styles.xpTextValue, { color: theme.brandPrimary }]}>
              {xp.toLocaleString()} XP
            </Text>
          </View>

          {/* Progress bar container */}
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.brandAccent,
                  width: xpProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {nextXPThreshold !== null ? (
            <Text style={[styles.xpSubtext, { color: theme.textMuted }]}>
              {xpRemaining.toLocaleString()} XP remaining to achieve next title threshold.
            </Text>
          ) : (
            <Text style={[styles.xpSubtext, { color: theme.success }]}>
              🎉 Highest Academic Spelling Rank achieved!
            </Text>
          )}
        </View>

        {/* Grid Stats */}
        <View style={styles.statsGrid}>
          {/* Academic SSR */}
          <View style={[styles.statTile, Shadows.card]}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statNumber}>{academic_ssr}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Academic SSR</Text>
          </View>

          {/* Wazobia SSR */}
          <View style={[styles.statTile, Shadows.card]}>
            <Text style={styles.statIcon}>🇳🇬</Text>
            <Text style={styles.statNumber}>{wazobia_ssr}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Wazobia SSR</Text>
          </View>

          {/* Streak */}
          <View style={[styles.statTile, Shadows.card]}>
            <Animated.Text style={[styles.statIcon, { transform: [{ scale: streakScale }] }]}>
              🔥
            </Animated.Text>
            <Text style={styles.statNumber}>{daily_streak} Days</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Daily Streak</Text>
          </View>

          {/* Words completed */}
          <View style={[styles.statTile, Shadows.card]}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statNumber}>{wordsCompleted}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Words Spelled</Text>
          </View>
        </View>

        {/* Graduation Status Section */}
        <View style={[styles.card, Shadows.card]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Graduation Status</Text>

          {isGraduated ? (
            <View style={styles.graduatedBox}>
              <Text style={styles.gradIcon}>🎓</Text>
              <View style={styles.gradInfo}>
                <Text style={[styles.gradTitle, { color: theme.textPrimary }]}>
                  Graduated SSS 2 Scholar
                </Text>
                <Text style={[styles.gradDate, { color: theme.textMuted }]}>
                  Certified on {graduation_date ? new Date(graduation_date).toLocaleDateString() : 'Date'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.certButton, { backgroundColor: theme.brandPrimary }]}
                onPress={() => router.push('/certificate')}
              >
                <Text style={styles.certButtonText}>View Certificate 📜</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.undergradBox}>
              <Text style={styles.lockIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.undergradTitle, { color: theme.textPrimary }]}>
                  SSS 2 Undergraduate
                </Text>
                <Text style={[styles.undergradDesc, { color: theme.textSecondary }]}>
                  Spelling Syllabus under review. Complete Diagnostic testing, and clear the SSS 2 final exam to graduate.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Interactive action buttons */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.disabledBtn]}
            onPress={handleChangeClass}
            activeOpacity={0.7}
          >
            <Text style={styles.disabledBtnText}>🔄 Change Class (Locked)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brandPrimary }]} onPress={handleLinkAccount}>
            <Text style={styles.actionBtnText}>☁️ Link Account (Cloud Sync)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cloud Sync Auth Simulation Modal */}
      <Modal
        visible={syncModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSyncModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.modal]}>
            <Text style={styles.modalTitle}>Sabi Cloud Synchronization</Text>
            <Text style={styles.modalSubtitle}>
              Create a Supabase-backed account to secure your SabiSpell stats & coins.
            </Text>

            {/* Simulated Auth Inputs */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="example@student.ng"
                placeholderTextColor="#A0B6CD"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#A0B6CD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            {/* Modal Actions */}
            {syncLoading ? (
              <ActivityIndicator size="large" color={theme.brandPrimary} style={styles.modalSpinner} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.modalBtnSubmit, { backgroundColor: theme.brandPrimary }]}
                  onPress={handleCreateSyncAccount}
                >
                  <Text style={styles.modalBtnSubmitText}>Create Account & Link Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => {
                    setSyncModalVisible(false);
                    setEmail('');
                    setPassword('');
                  }}
                >
                  <Text style={[styles.modalBtnCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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
  profileCard: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  avatarOutline: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5FC',
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  usernameText: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    marginBottom: 4,
  },
  classTag: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: Spacing.md,
  },
  titleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.round,
  },
  titleBadgeText: {
    color: GlobalColors.white,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.headingSemi,
  },
  card: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
  },
  xpTextValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.heading,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#EEF5FC',
    borderRadius: Radii.xs,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radii.xs,
  },
  xpSubtext: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statTile: {
    width: '48%',
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 110, 189, 0.08)',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.heading,
    color: '#0D1B2A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
  graduatedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  gradIcon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  gradInfo: {
    flex: 1,
  },
  gradTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
  },
  gradDate: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
  },
  certButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
  },
  certButtonText: {
    color: GlobalColors.white,
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.xs,
  },
  undergradBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: '#EEF5FC',
    padding: Spacing.md,
    borderRadius: Radii.sm,
  },
  lockIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  undergradTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.headingSemi,
    marginBottom: 2,
  },
  undergradDesc: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    lineHeight: 16,
  },
  actionBlock: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    height: 48,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionBtnText: {
    color: GlobalColors.white,
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
  disabledBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE9F8',
  },
  disabledBtnText: {
    color: '#7A94B0',
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.heading,
    color: '#0D1B2A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    color: '#7A94B0',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#EEF5FC',
    borderWidth: 1,
    borderColor: '#DCE9F8',
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: FontSizes.base,
    fontFamily: FontFamily.body,
    color: '#0D1B2A',
    marginBottom: Spacing.md,
  },
  modalSpinner: {
    marginVertical: Spacing.md,
  },
  modalBtnSubmit: {
    height: 52,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalBtnSubmitText: {
    color: GlobalColors.white,
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.md,
  },
  modalBtnCancel: {
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#EEF5FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontFamily: FontFamily.headingSemi,
    fontSize: FontSizes.base,
  },
});
