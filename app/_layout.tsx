/**
 * app/_layout.tsx
 *
 * Root layout for SabiSpell. Responsibilities:
 *   1. Prevent the Expo splash screen from auto-hiding until fonts are ready.
 *   2. Load all three custom font families (Space Grotesk, Inter, Source Code Pro).
 *   3. Once fonts are loaded (or if loading fails), hide the splash and render
 *      the expo-router <Stack> navigator that drives all screens.
 *
 * Font usage across the app:
 *   SpaceGrotesk — headings, wordmark, display text
 *   Inter         — body copy, labels, UI strings
 *   SourceCodePro — word display dashes, monospaced spelling output
 */

import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  SourceCodePro_400Regular,
} from '@expo-google-fonts/source-code-pro';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

// ─── Prevent the native splash screen from hiding before fonts are ready ──────
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Space Grotesk — headings
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,

    // Inter — body text
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,

    // Source Code Pro — spelling display
    SourceCodePro_400Regular,
  });

  // Hide the splash screen once fonts are ready (or on error so the app
  // doesn't hang indefinitely on a device that can't load fonts).
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null while fonts are still loading — splash stays visible.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      {/*
        StatusBar style is managed per-screen via the expo-status-bar package.
        We set a default here; individual screens override as needed.
      */}
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          // All screens opt out of the native header — each screen renders
          // its own custom header as part of the design system.
          headerShown: false,

          // Shared animation defaults. Individual screens may override.
          animation: 'slide_from_right',

          // Consistent background prevents white flash between navigations.
          contentStyle: { backgroundColor: '#EEF5FC' },
        }}
      />
    </>
  );
}
