import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Themes, FontFamily, FontSizes, Spacing, Shadows, GlobalColors, Radii } from '../../src/constants/Colors';

const ajalaWazobiaImg = require('../../assets/images/ajala_wazobia.png');

export default function WazobiaGameScreen() {
  const router = useRouter();
  const theme  = Themes.wazobia;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity id="wazobia-back-btn" onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.brandPrimary }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.avatarRing, { borderColor: theme.brandAccent }]}>
          <Image source={ajalaWazobiaImg} style={styles.avatar} resizeMode="contain" />
        </View>

        <View style={[styles.card, Shadows.card]}>
          <Text style={styles.emoji}>🥁</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Wazobia Mode</Text>
          <Text style={[styles.sub,   { color: theme.brandPrimary }]}>Ẹ máa wà! — Coming in Week 3</Text>
          <Text style={[styles.desc,  { color: theme.textSecondary }]}>
            Spell Yoruba words with tone marks, hear the Gangan drum on every correct answer, and unlock traditional proverbs.
          </Text>
          {['🎹  Custom diacritic keyboard (ọ ẹ ṣ ú à è)', '🥁  Gangan drum on correct answers', '📜  Yoruba proverbs after each word', '🎨  Ankara tile background pattern'].map(f => (
            <View key={f} style={styles.feat}><Text style={[styles.featText, { color: theme.textSecondary }]}>{f}</Text></View>
          ))}
        </View>

        <TouchableOpacity id="wazobia-back-cta" onPress={() => router.back()}
          style={[styles.cta, { backgroundColor: theme.brandPrimary }]} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Back to Mode Select</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  back:       { fontSize: FontSizes.md, fontFamily: FontFamily.bodySemiBold },
  content:    { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.lg },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3EE', marginBottom: Spacing.lg, shadowColor: '#C1440E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  avatar:     { width: 72, height: 72, borderRadius: 36 },
  card:       { width: '100%', backgroundColor: GlobalColors.white, borderRadius: Radii.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(193,68,14,0.1)', marginBottom: Spacing.lg },
  emoji:      { fontSize: 40, marginBottom: Spacing.sm },
  title:      { fontSize: FontSizes.xl, fontFamily: FontFamily.heading, marginBottom: 4 },
  sub:        { fontSize: FontSizes.sm, fontFamily: FontFamily.bodySemiBold, marginBottom: Spacing.md },
  desc:       { fontSize: FontSizes.sm, fontFamily: FontFamily.body, textAlign: 'center', lineHeight: FontSizes.sm * 1.6, marginBottom: Spacing.md },
  feat:       { alignSelf: 'stretch', paddingVertical: 4 },
  featText:   { fontSize: FontSizes.sm, fontFamily: FontFamily.body },
  cta:        { width: '100%', height: 52, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  ctaText:    { color: GlobalColors.white, fontSize: FontSizes.md, fontFamily: FontFamily.headingSemi },
});
