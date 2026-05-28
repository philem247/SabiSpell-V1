import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

export type AjalaState = 'standard' | 'exam_warrior' | 'wazobia' | 'sandbox' | 'graduation';

interface AjalaAvatarProps {
  state?: AjalaState;
  size?: number;
  triggerCorrect?: boolean;
  triggerWrong?: boolean;
  borderColor?: string;
}

const AJALA_IMAGES: Record<AjalaState, ImageSourcePropType> = {
  standard:     require('../../assets/images/ajala_standard.png'),
  exam_warrior: require('../../assets/images/ajala_exam_warrior.png'),
  wazobia:      require('../../assets/images/ajala_wazobia.png'),
  sandbox:      require('../../assets/images/ajala_sandbox.png'),
  graduation:   require('../../assets/images/ajala_graduation.png'),
};

export default function AjalaAvatar({
  state = 'standard',
  size = 80,
  triggerCorrect = false,
  triggerWrong = false,
  borderColor,
}: AjalaAvatarProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  // Bounce up on correct answer
  useEffect(() => {
    if (!triggerCorrect) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, { toValue: -18, useNativeDriver: true, speed: 28, bounciness: 12 }),
        Animated.spring(scale,      { toValue: 1.15, useNativeDriver: true, speed: 28, bounciness: 10 }),
      ]),
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 8 }),
        Animated.spring(scale,      { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
      ]),
    ]).start();
  }, [triggerCorrect]);

  // Shake on wrong answer
  useEffect(() => {
    if (!triggerWrong) return;
    Animated.sequence([
      Animated.timing(translateX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  -8, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:   8, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  -4, duration: 55, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:   0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [triggerWrong]);

  const ring = size + 8;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderColor: borderColor ?? '#E2EDF8',
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      <Image
        source={AJALA_IMAGES[state]}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    shadowColor: '#0A6EBD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
