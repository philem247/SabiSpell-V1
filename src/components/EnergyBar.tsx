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
        {pips.map((active, idx) => (
          <View
            key={idx}
            style={[
              styles.pip,
              {
                backgroundColor: active ? theme.energyFill : theme.energyEmpty,
                borderColor: active ? theme.brandSecondary : theme.border,
              },
            ]}
          />
        ))}
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
    letterSpacing: 1,
    marginBottom: 4,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pip: {
    width: 14,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    marginRight: 4,
  },
  text: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.mono,
    marginLeft: 6,
    fontWeight: 'bold',
  },
});
