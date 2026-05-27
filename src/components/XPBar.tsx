import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { AppConfig } from '../constants/AppConfig';
import { Themes, ThemeKey, FontSizes, FontFamily, Radii } from '../constants/Colors';

interface XPBarProps {
  xp: number;
  themeKey?: ThemeKey;
}

export function XPBar({ xp, themeKey = 'sss' }: XPBarProps) {
  const theme = Themes[themeKey];

  // Find current title tier
  const currentTitleObj = [...AppConfig.XP_TITLES]
    .reverse()
    .find((t) => xp >= t.minXP) || AppConfig.XP_TITLES[0];

  // Find next title tier
  const nextTitleObj = AppConfig.XP_TITLES.find((t) => t.minXP > xp);

  let progressFraction = 1.0;
  let progressLabel = '';
  let nextTitleName = 'MAX';

  if (nextTitleObj) {
    const range = nextTitleObj.minXP - currentTitleObj.minXP;
    progressFraction = (xp - currentTitleObj.minXP) / range;
    progressLabel = `${xp} / ${nextTitleObj.minXP} XP`;
    nextTitleName = nextTitleObj.title;
  } else {
    progressLabel = `${xp} XP`;
  }

  // Animation setup
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressFraction,
      duration: 600,
      useNativeDriver: false, // width animation requires layout reflow, cannot use native driver
    }).start();
  }, [progressFraction]);

  // Interpolate the width animation into percentage string
  const fillWidth = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Title Labels Row */}
      <View style={styles.labelsRow}>
        <Text style={[styles.titleText, { color: theme.brandPrimary }]}>
          {currentTitleObj.title}
        </Text>
        <Text style={[styles.nextTitleText, { color: theme.textMuted }]}>
          Next: {nextTitleName}
        </Text>
      </View>

      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: theme.xpTrack }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: theme.xpFill,
              width: fillWidth,
            },
          ]}
        />
      </View>

      {/* Numerical Progress Label */}
      <View style={styles.infoRow}>
        <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
          {progressLabel}
        </Text>
        {nextTitleObj && (
          <Text style={[styles.percentageLabel, { color: theme.textSecondary }]}>
            {Math.round(progressFraction * 100)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  titleText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.headingSemi,
  },
  nextTitleText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
  track: {
    height: 12,
    borderRadius: Radii.round,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.round,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.mono,
  },
  percentageLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
  },
});
