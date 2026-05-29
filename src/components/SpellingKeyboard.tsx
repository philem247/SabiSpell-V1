import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Themes, ThemeTokens, FontFamily } from '../constants/Colors';

interface KeyboardKeyProps {
  label: string;
  onPress: (key: string) => void;
  width: number;
  height: number;
  theme: ThemeTokens;
  disabled?: boolean;
}

function KeyboardKey({ label, onPress, width, height, theme, disabled }: KeyboardKeyProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.90, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    onPress(label);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={handlePress}
        style={[
          styles.key,
          {
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            width,
            height,
          },
        ]}
      >
        <Text style={[styles.keyText, { color: theme.textPrimary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface SpellingKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  theme?: ThemeTokens;
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 380;
const isDesktop = Platform.OS === 'web' && screenWidth > 768;

const KEYBOARD_WIDTH = isDesktop ? 600 : screenWidth;
const KEY_MARGIN = isSmallDevice ? 2 : 4;
const KEY_HEIGHT = isSmallDevice ? 44 : 50;
// 10 columns, with margins on both sides of each key
const KEY_WIDTH = (KEYBOARD_WIDTH - 20 - (10 * KEY_MARGIN * 2)) / 10;

// SVG Icons
const DeleteIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 4H8L1.5 12L8 20H21C22.1 20 23 19.1 23 18V6C23 4.9 22.1 4 21 4ZM19 15L17.6 16.4L14.5 13.3L11.4 16.4L10 15L13.1 11.9L10 8.8L11.4 7.4L14.5 10.5L17.6 7.4L19 8.8L15.9 11.9L19 15Z"
      fill={color}
    />
  </Svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z"
      fill={color}
    />
  </Svg>
);

export default function SpellingKeyboard({
  onKeyPress,
  onDelete,
  onSubmit,
  disabled = false,
  theme = Themes.sss,
}: SpellingKeyboardProps) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const submitScaleAnim = useRef(new Animated.Value(1)).current;
  const deleteScaleAnim = useRef(new Animated.Value(1)).current;

  const handleSubmitPress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(submitScaleAnim, { toValue: 0.90, duration: 60, useNativeDriver: true }),
      Animated.spring(submitScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    onSubmit();
  };

  const handleDeletePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(deleteScaleAnim, { toValue: 0.90, duration: 60, useNativeDriver: true }),
      Animated.spring(deleteScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    onDelete();
  };

  // Listen to physical keyboard events on Web
  React.useEffect(() => {
    if (Platform.OS !== 'web' || disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key;
      if (key === 'Backspace') {
        event.preventDefault();
        onDelete();
      } else if (key === 'Enter') {
        event.preventDefault();
        onSubmit();
      } else if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        onKeyPress(key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, onDelete, onSubmit, onKeyPress]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgSecondary, borderTopColor: theme.border }]}>
      <View style={[styles.keyboardWrapper, isDesktop && styles.desktopWrapper]}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {/* Action button at the start of the third row */}
            {rowIndex === 2 && (
              <Animated.View style={{ transform: [{ scale: submitScaleAnim }] }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={disabled}
                  onPress={handleSubmitPress}
                  style={[
                    styles.key,
                    styles.specialKey,
                    {
                      backgroundColor: theme.success,
                      borderColor: theme.success,
                      width: KEY_WIDTH * 1.5,
                      height: KEY_HEIGHT,
                    },
                  ]}
                >
                  <CheckIcon color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {row.map((key) => (
              <KeyboardKey
                key={key}
                label={key}
                width={KEY_WIDTH}
                height={KEY_HEIGHT}
                theme={theme}
                onPress={onKeyPress}
                disabled={disabled}
              />
            ))}

            {/* Delete button at the end of the third row */}
            {rowIndex === 2 && (
              <Animated.View style={{ transform: [{ scale: deleteScaleAnim }] }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={disabled}
                  onPress={handleDeletePress}
                  style={[
                    styles.key,
                    styles.specialKey,
                    {
                      backgroundColor: theme.error + '25',
                      borderColor: theme.border,
                      width: KEY_WIDTH * 1.5,
                      height: KEY_HEIGHT,
                    },
                  ]}
                >
                  <DeleteIcon color={theme.error} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
    borderTopWidth: 1.5,
    width: '100%',
    alignItems: 'center',
  },
  keyboardWrapper: {
    width: '100%',
    paddingHorizontal: 8,
  },
  desktopWrapper: {
    maxWidth: 600,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: KEY_MARGIN * 2,
  },
  key: {
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 2,
  },
  specialKey: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: isSmallDevice ? 15 : 17,
    fontFamily: FontFamily.mono,
    fontWeight: 'bold',
  },
});
