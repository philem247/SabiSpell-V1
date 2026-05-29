import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Spacing, Shadows } from '../src/constants/Colors';
import CertificateSVG from '../src/components/CertificateSVG';
import AjalaAvatar from '../src/components/AjalaAvatar';
import { initAudio, playCelebration } from '../src/services/audio';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConfettiProps {
  yAnim: Animated.Value;
  rotateAnim: Animated.Value;
  xPos: number;
  size: number;
  symbol: string;
  startAnimation: () => void;
}

export default function CertificateScreen() {
  const router = useRouter();
  const theme = Themes.sss; // SSS 2 Lagoon Blue theme

  // Load profile state
  const { username, graduation_date } = useProfileStore();

  const [sharing, setSharing] = useState(false);
  const certificateRef = useRef<View>(null);

  // ── Confetti Particle Generator ──────────────────────────────────────────────
  const confettiParticles = useRef<ConfettiProps[]>([]);

  if (confettiParticles.current.length === 0) {
    const symbols = ['⭐', '🎉', '🎓', '✨', '🏆'];
    confettiParticles.current = Array.from({ length: 30 }, (_, i) => {
      const yAnim = new Animated.Value(-40);
      const rotateAnim = new Animated.Value(0);
      const xPos = Math.random() * 90; // random percentage left offset
      const size = 14 + Math.random() * 16;
      const speed = 3000 + Math.random() * 2500;
      const delay = Math.random() * 2000;
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];

      const startAnimation = () => {
        yAnim.setValue(-40);
        rotateAnim.setValue(0);

        Animated.parallel([
          Animated.timing(yAnim, {
            toValue: screenHeight + 40,
            duration: speed,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: speed,
            delay: delay,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Loop particle animation infinitely
          startAnimation();
        });
      };

      return { yAnim, rotateAnim, xPos, size, symbol, startAnimation };
    });
  }

  // ── Mount: Audio Fanfare & Confetti Start ─────────────────────────────────────
  useEffect(() => {
    // Play fanfare
    initAudio().then(() => {
      playCelebration();
    });

    // Start all confetti animations
    confettiParticles.current.forEach((p) => p.startAnimation());
  }, []);

  // ── Share Certificate Logic ───────────────────────────────────────────────────
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      // Small timeout to guarantee layout completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      const uri = await captureRef(certificateRef, {
        format: 'png',
        quality: 0.98,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your SabiSpell Graduation Certificate!',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this platform.');
      }
    } catch (error) {
      console.error('[Certificate] Sharing failed:', error);
      Alert.alert('Share Failed', 'Could not generate certificate image. Try again!');
    } finally {
      setSharing(false);
    }
  };

  const formattedDate = graduation_date || new Date().toLocaleDateString();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Confetti Rain Layer */}
      {confettiParticles.current.map((p, i) => {
        const spin = p.rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.Text
            key={i}
            style={[
              styles.confetti,
              {
                left: `${p.xPos}%`,
                fontSize: p.size,
                transform: [{ translateY: p.yAnim }, { rotate: spin }],
              },
            ]}
          >
            {p.symbol}
          </Animated.Text>
        );
      })}

      <View style={styles.container}>
        {/* Celebration Headers */}
        <View style={styles.header}>
          <Text style={[styles.congratsTitle, { color: theme.brandAccent }]}>🎉 CONGRATULATIONS! 🎉</Text>
          <Text style={[styles.congratsSubtitle, { color: theme.textSecondary }]}>
            You have successfully graduated SSS 2!
          </Text>
        </View>

        {/* Certificate Composite Card (SVG + Floating Mascot) */}
        <View style={styles.certificateOuterCard}>
          <View ref={certificateRef} collapsable={false} style={styles.certificateCaptureFrame}>
            <CertificateSVG username={username} date={formattedDate} />
            
            {/* Mascot layered sitting slightly overlapping bottom frame */}
            <View style={styles.mascotOverlay}>
              <AjalaAvatar state="graduation" size={54} borderColor={theme.brandAccent} />
            </View>
          </View>
        </View>

        {/* Action CTAs */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.88}
            disabled={sharing}
            style={[styles.shareBtn, { backgroundColor: theme.brandPrimary }, Shadows.button]}
          >
            <Text style={styles.shareBtnText}>
              {sharing ? 'Generating Certificate…' : '📤  Share Certificate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/dashboard' as any)}
            activeOpacity={0.85}
            style={[styles.homeBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.homeBtnText, { color: theme.textSecondary }]}>Go to Dashboard 🏠</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  congratsTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  congratsSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    textAlign: 'center',
  },
  certificateOuterCard: {
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  certificateCaptureFrame: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingBottom: 4, // slight breathing room for layout composite
  },
  mascotOverlay: {
    position: 'absolute',
    top: '5%',
    right: '5%',
    zIndex: 100,
    // Soft shadow for layout depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 5,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginBottom: Spacing.base,
  },
  shareBtn: {
    height: 52,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: GlobalColors.white,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
    letterSpacing: 0.3,
  },
  homeBtn: {
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
  },
});
