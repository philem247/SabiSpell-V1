import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, Animated, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../src/store/profileStore';
import { Themes, GlobalColors, FontSizes, FontFamily } from '../src/constants/Colors';

const ajalaStandardImg = require('../assets/images/ajala_standard.png');
const sabiSpellLogoImg = require('../assets/images/sabispell_logo.png');

export default function SplashScreen() {
  const router = useRouter();
  const hasOnboarded = useProfileStore((state) => state.hasOnboarded);
  
  const [splashFinished, setSplashFinished] = useState(false);
  const [hydrated, setHydrated] = useState(useProfileStore.persist.hasHydrated());

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const mascotFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Kick off splash fade-in animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in Mascot gently after logo loads
      Animated.timing(mascotFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    // 2. Set splash visual timer (2 seconds)
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2200);

    // 3. Monitor Zustand store hydration
    const unsub = useProfileStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Check if store was already hydrated on mount
    if (useProfileStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // 4. Guard routing check: wait for hydration AND minimum splash duration
  useEffect(() => {
    if (splashFinished && hydrated) {
      if (hasOnboarded) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [splashFinished, hydrated, hasOnboarded]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* SabiSpell App Logo */}
        <Image source={sabiSpellLogoImg} style={styles.logo} resizeMode="contain" />

        {/* Wordmark and Subtitle */}
        <Text style={styles.wordmark}>SabiSpell</Text>
        <Text style={styles.subtitle}>Nigeria's #1 Adaptive Spelling Game</Text>
      </Animated.View>

      {/* Mascot greeting (fades in slightly later for a premium, multi-layered look) */}
      <Animated.View style={[styles.mascotContainer, { opacity: mascotFadeAnim }]}>
        <Image source={ajalaStandardImg} style={styles.mascot} resizeMode="contain" />
        <Text style={styles.mascotBubble}>Ẹ káàbọ̀! Welcome! 👋</Text>
      </Animated.View>

      {/* Subtle loader */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={GlobalColors.sabiGold} />
        <Text style={styles.loaderText}>Loading Scholar profile...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041E3A', // Premium deep dark navy
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 32,
    marginBottom: 20,
  },
  wordmark: {
    fontSize: FontSizes.mega,
    fontFamily: FontFamily.heading,
    color: GlobalColors.sabiGold,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.bodyMedium,
    color: '#8CAECF', // Muted ice-blue text
    marginTop: 8,
    textAlign: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 120,
    height: 120,
  },
  mascotBubble: {
    marginTop: 8,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSizes.sm,
    color: GlobalColors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
    color: '#6085A6', // Muted loading text
  },
});
