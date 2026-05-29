import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Path, Text, G } from 'react-native-svg';
import { Themes, GlobalColors } from '../constants/Colors';

interface CertificateSVGProps {
  username: string;
  date: string;
  tier?: string;
}

export default function CertificateSVG({
  username,
  date,
  tier = 'SSS 2 Academic League',
}: CertificateSVGProps) {
  const theme = Themes.sss;

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 400 280" style={styles.svg}>
        {/* Background Card */}
        <Rect x="0" y="0" width="400" height="280" rx="16" fill="#FFFFFF" />

        {/* Outer Frame (Gold border) */}
        <Rect
          x="10"
          y="10"
          width="380"
          height="260"
          rx="12"
          fill="none"
          stroke="#F5A623"
          strokeWidth="3"
        />

        {/* Inner Frame (Lagoon Blue border) */}
        <Rect
          x="15"
          y="15"
          width="370"
          height="250"
          rx="10"
          fill="none"
          stroke={theme.brandPrimary}
          strokeWidth="1.5"
          strokeDasharray="6,4"
        />

        {/* Corner Ornaments */}
        {/* Top-Left */}
        <Path d="M12 28 H28 M28 12 V28" fill="none" stroke="#F5A623" strokeWidth="2.5" />
        {/* Top-Right */}
        <Path d="M388 28 H372 M372 12 V28" fill="none" stroke="#F5A623" strokeWidth="2.5" />
        {/* Bottom-Left */}
        <Path d="M12 252 H28 M28 268 V252" fill="none" stroke="#F5A623" strokeWidth="2.5" />
        {/* Bottom-Right */}
        <Path d="M388 252 H372 M372 268 V252" fill="none" stroke="#F5A623" strokeWidth="2.5" />

        {/* Certificate Text Content */}
        {/* Header */}
        <Text
          x="200"
          y="45"
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fill={theme.textMuted}
          letterSpacing="2.5"
        >
          SABISPELL ACADEMY
        </Text>

        <Text
          x="200"
          y="68"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill={theme.brandSecondary}
          letterSpacing="0.5"
        >
          Certificate of Graduation
        </Text>

        {/* Certified statement */}
        <Text
          x="200"
          y="95"
          textAnchor="middle"
          fontSize="9"
          fontStyle="italic"
          fill={theme.textSecondary}
        >
          This is to certify that
        </Text>

        {/* Student Name */}
        <Text
          x="200"
          y="126"
          textAnchor="middle"
          fontSize="20"
          fontWeight="900"
          fill={theme.textPrimary}
        >
          {username || 'Scholar'}
        </Text>

        {/* Divider line under name */}
        <Path d="M110 138 H290" fill="none" stroke="#DCE9F8" strokeWidth="1.5" />

        {/* Degree Statement */}
        <Text
          x="200"
          y="156"
          textAnchor="middle"
          fontSize="9"
          fill={theme.textSecondary}
        >
          has successfully passed the graduation exam for the
        </Text>

        <Text
          x="200"
          y="176"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#F5A623"
          letterSpacing="0.5"
        >
          {tier.toUpperCase()}
        </Text>

        {/* Date */}
        <Text
          x="200"
          y="200"
          textAnchor="middle"
          fontSize="9"
          fill={theme.textMuted}
        >
          Awarded on {date}
        </Text>

        {/* Signatures & Seal */}
        <G>
          {/* Left Signee: Àjàlá */}
          <Path d="M45 236 H125" fill="none" stroke={theme.divider} strokeWidth="1" />
          <Text x="85" y="230" textAnchor="middle" fontSize="10" fontStyle="italic" fill={theme.brandPrimary}>
            Àjàlá the Explorer
          </Text>
          <Text x="85" y="248" textAnchor="middle" fontSize="7" fill={theme.textMuted}>
            EXAM PROCTOR
          </Text>
        </G>

        {/* Right Signee: SabiSpell Team */}
        <G>
          <Path d="M275 236 H355" fill="none" stroke={theme.divider} strokeWidth="1" />
          <Text x="315" y="230" textAnchor="middle" fontSize="10" fontStyle="italic" fill={theme.brandPrimary}>
            SabiSpell Team
          </Text>
          <Text x="315" y="248" textAnchor="middle" fontSize="7" fill={theme.textMuted}>
            ACADEMIC BOARD
          </Text>
        </G>

        {/* Gold Seal SVG representation */}
        <G transform="translate(182, 222)">
          {/* Seal star points */}
          <Path
            d="M 18,0 L 12,5 L 15,12 L 8,11 L 5,18 L 0,12 L -5,18 L -8,11 L -15,12 L -12,5 L -18,0 L -12,-5 L -15,-12 L -8,-11 L -5,-18 L 0,-12 L 5,-18 L 8,-11 L 15,-12 L 12,-5 Z"
            fill="#F5A623"
            stroke="#D48806"
            strokeWidth="1"
          />
          {/* Inner Seal Circle */}
          <Path
            d="M 0,0 M -10,0 A 10,10 0 1 1 10,0 A 10,10 0 1 1 -10,0"
            fill="#F5A623"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          {/* Seal text mark */}
          <Text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="#FFFFFF"
          >
            SABI
          </Text>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 400 / 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  svg: {
    alignSelf: 'center',
  },
});
