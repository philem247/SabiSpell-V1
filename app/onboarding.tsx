import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../src/store/profileStore';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';

const ajalaStandardImg = require('../assets/images/ajala_standard.png');

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboarded = useProfileStore((state) => state.setOnboarded);

  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate the username based on length (3-20 chars) and alphanumeric rules
  const handleValidateAndSubmit = () => {
    setError(null);
    const trimmed = username.trim();

    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less.');
      return;
    }

    // Alphanumeric, spaces, and underscores allowed
    const validPattern = /^[a-zA-Z0-9 _]+$/;
    if (!validPattern.test(trimmed)) {
      setError('Only letters, numbers, spaces, and underscores allowed.');
      return;
    }

    setLoading(true);

    // Simulate a brief writing to store animation delay for premium UI feel
    setTimeout(() => {
      // Sets hasOnboarded: true, awards 150 coins, sets declaredClass: 'SSS 2'
      setOnboarded(trimmed, 'SSS 2');
      setLoading(false);
      router.replace('/dashboard');
    }, 800);
  };

  const theme = Themes.sss; // Onboarding defaults to primary Lagoon Blue (SSS 2) theme

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Area */}
          <View style={styles.header}>
            <Text style={[styles.wordmark, { color: theme.brandPrimary }]}>SabiSpell</Text>
            <Text style={[styles.subheader, { color: theme.textSecondary }]}>
              Academic Spelling League • SSS 2
            </Text>
          </View>

          {/* Main Form Card */}
          <View style={[styles.card, Shadows.card]}>
            {/* Mascot Greeting */}
            <View style={styles.mascotSection}>
              <View style={[styles.mascotBadge, { backgroundColor: theme.bgSecondary, borderColor: theme.brandAccent }]}>
                <Image source={ajalaStandardImg} style={styles.mascot} resizeMode="contain" />
              </View>
              <View style={[styles.speechBubble, { backgroundColor: theme.bgSecondary }]}>
                <Text style={[styles.speechText, { color: theme.textPrimary }]}>
                  Ẹ n lẹ́! Hello! I am <Text style={styles.boldText}>Àjàlá</Text>, your spelling guide. What nickname would you like to be called?
                </Text>
              </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>CHOOSE NICKNAME</Text>
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (error) setError(null); // clear error when user types
                }}
                placeholder="e.g., SpellChampion"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    fontFamily: FontFamily.bodyMedium,
                    borderColor: error
                      ? theme.error
                      : isFocused
                      ? theme.inputBorderFocused
                      : theme.inputBorder,
                    backgroundColor: theme.inputBg,
                  },
                ]}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={25}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              {/* Error feedback */}
              {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
            </View>

            {/* Submit Button CTA */}
            <TouchableOpacity
              onPress={handleValidateAndSubmit}
              activeOpacity={0.8}
              disabled={loading}
              style={[
                styles.submitButton,
                { backgroundColor: theme.brandPrimary },
                Shadows.button,
                loading && styles.disabledButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={GlobalColors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Play as SSS 2 Student</Text>
              )}
            </TouchableOpacity>

            {/* Starter Gift Info */}
            <View style={styles.giftInfo}>
              <Text style={[styles.giftText, { color: theme.textMuted }]}>
                🎁 Welcoming gift of <Text style={[styles.giftCoins, { color: theme.brandAccent }]}>150 coins</Text> will be added to your profile!
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  wordmark: {
    fontSize: FontSizes.xxl,
    fontFamily: FontFamily.heading,
    letterSpacing: 1,
  },
  subheader: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: GlobalColors.white,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'stretch',
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mascotBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    // Add micro shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mascot: {
    width: 80,
    height: 80,
  },
  speechBubble: {
    padding: Spacing.md,
    borderRadius: Radii.md,
    width: '100%',
  },
  speechText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.body,
    lineHeight: FontSizes.base * 1.4,
    textAlign: 'center',
  },
  boldText: {
    fontFamily: FontFamily.bodySemiBold,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.base,
    fontSize: FontSizes.md,
    color: GlobalColors.black,
  },
  errorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyMedium,
    marginTop: Spacing.sm,
  },
  submitButton: {
    height: 52,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: GlobalColors.white,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
    letterSpacing: 0.5,
  },
  giftInfo: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  giftText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodyMedium,
    textAlign: 'center',
  },
  giftCoins: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
