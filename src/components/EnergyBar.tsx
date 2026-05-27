import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AppConfig } from '../constants/AppConfig';
import { Themes, ThemeKey, FontSizes, FontFamily } from '../constants/Colors';

interface EnergyBarProps {
  energy: number;
  themeKey?: ThemeKey;
}

export function EnergyBar({ energy, themeKey = 'sss' }: EnergyBarProps) {
  const theme = Themes[themeKey];
  const cap = AppConfig.ENERGY_CAP;
  const totalPips = Math.max(cap, energy);

  const pips: boolean[] = [];
  for (let i = 0; i < totalPips; i++) {
    pips.push(i < energy);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>ENERGY</Text>
      <View style={styles.bar}>
        <View style={styles.pipsRow}>
          {pips.map((active, idx) => (
            <View
              key={idx}
              style={[
                styles.pip,
                {
                  backgroundColor: active ? theme.energyFill : 'rgba(196, 220, 244, 0.3)',
                  borderColor: active ? theme.brandPrimary : 'rgba(196, 220, 244, 0.6)',
                  // iOS shadow for active pips
                  shadowColor: active ? theme.brandPrimary : 'transparent',
                  shadowOffset: active ? { width: 0, height: 2 } : { width: 0, height: 0 },
                  shadowOpacity: active ? 0.4 : 0,
                  shadowRadius: 3,
                  elevation: active ? 2 : 0,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.text, { color: theme.textPrimary }]}>
          {energy}/{cap}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pip: {
    width: 16,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    marginRight: 6,
  },
  text: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.mono,
    marginLeft: 8,
    fontWeight: '700',
  },
});
