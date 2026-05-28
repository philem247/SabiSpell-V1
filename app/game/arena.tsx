import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Themes, FontFamily, FontSizes, Spacing, Shadows, GlobalColors, Radii } from '../../src/constants/Colors';
import { SABIBOT_PROFILE } from '../../src/constants/DemoSeeds';

const ajalaStandardImg = require('../../assets/images/ajala_standard.png');

export default function ArenaGameScreen() {
  const router = useRouter();
  const theme  = Themes.sss;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity id="arena-back-btn" onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.brandPrimary }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.banner, { backgroundColor: '#1A0A00' }]}>
          <Text style={styles.bannerEmoji}>⚔️</Text>
          <Text style={styles.bannerLabel}>SPELL ARENA</Text>
          <Text style={styles.bannerVs}>vs  {SABIBOT_PROFILE.username}</Text>
        </View>

        <View style={[styles.card, Shadows.card]}>
          <View style={styles.botRow}>
            <View style={[styles.botAvatar, { borderColor: '#D4A017' }]}>
              <Image source={ajalaStandardImg} style={styles.botImg} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.botName,    { color: theme.textPrimary  }]}>{SABIBOT_PROFILE.username}</Text>
              <Text style={[styles.botTitle,   { color: theme.textMuted    }]}>{SABIBOT_PROFILE.title} · SSR {SABIBOT_PROFILE.ssr}</Text>
              <Text style={[styles.botAccuracy,{ color: '#D4A017'          }]}>~72% accuracy · 5–13s response</Text>
            </View>
          </View>

          <Text style={[styles.sub,  { color: theme.brandPrimary  }]}>Coming in Week 3 🚀</Text>
          <Text style={[styles.desc, { color: theme.textSecondary }]}>
            Race SabiBot word-for-word. First to 5 correct wins. In production, this is a real classmate from your school.
          </Text>
          {['📊  Live progress bars for both players', '⏱️  SabiBot thinks for 5–13 seconds (feels human)', '🏆  Podium reveal after 5 words', '📡  Real multiplayer in production (WebSocket)'].map(f => (
            <View key={f} style={styles.feat}><Text style={[styles.featText, { color: theme.textSecondary }]}>{f}</Text></View>
          ))}
        </View>

        <TouchableOpacity id="arena-back-cta" onPress={() => router.back()}
          style={[styles.cta, { backgroundColor: '#D4A017' }]} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Back to Mode Select</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  back:        { fontSize: FontSizes.md, fontFamily: FontFamily.bodySemiBold },
  content:     { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  banner:      { width: '100%', borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  bannerEmoji: { fontSize: 36, marginBottom: 4 },
  bannerLabel: { fontSize: FontSizes.sm, fontFamily: FontFamily.headingSemi, color: '#F5A623', letterSpacing: 3, marginBottom: 2 },
  bannerVs:    { fontSize: FontSizes.xl, fontFamily: FontFamily.heading, color: GlobalColors.white },
  card:        { width: '100%', backgroundColor: GlobalColors.white, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(212,160,23,0.15)', marginBottom: Spacing.lg },
  botRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  botAvatar:   { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBF0', marginRight: Spacing.md },
  botImg:      { width: 48, height: 48, borderRadius: 24 },
  botName:     { fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi, marginBottom: 2 },
  botTitle:    { fontSize: FontSizes.xs, fontFamily: FontFamily.body, marginBottom: 2 },
  botAccuracy: { fontSize: FontSizes.xs, fontFamily: FontFamily.bodySemiBold },
  sub:         { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold, marginBottom: Spacing.sm, textAlign: 'center' },
  desc:        { fontSize: FontSizes.sm, fontFamily: FontFamily.body, lineHeight: FontSizes.sm * 1.6, textAlign: 'center', marginBottom: Spacing.md },
  feat:        { alignSelf: 'stretch', paddingVertical: 4 },
  featText:    { fontSize: FontSizes.sm, fontFamily: FontFamily.body },
  cta:         { width: '100%', height: 52, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  ctaText:     { color: GlobalColors.white, fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi },
});
