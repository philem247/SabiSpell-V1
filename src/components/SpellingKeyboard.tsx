import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const KeyboardKey = React.memo(function KeyboardKey({ label, onPress, width, height, theme, disabled }: KeyboardKeyProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onPress(label)}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
          width,
          height,
          transform: [{ scale: pressed && !disabled ? 0.90 : 1 }],
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <Text style={[styles.keyText, { color: theme.textPrimary }]}>{label}</Text>
    </Pressable>
  );
});

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

const SpellingKeyboard = React.memo(function SpellingKeyboard({
  onKeyPress,
  onDelete,
  onSubmit,
  disabled = false,
  theme = Themes.sss,
}: SpellingKeyboardProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 22);

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

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
    <View style={[styles.container, { backgroundColor: theme.bgSecondary, borderTopColor: theme.border, paddingBottom: bottomPadding }]}>
      <View style={[styles.keyboardWrapper, isDesktop && styles.desktopWrapper]}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {/* Action button at the start of the third row */}
            {rowIndex === 2 && (
              <Pressable
                disabled={disabled}
                onPress={onSubmit}
                style={({ pressed }) => [
                  styles.key,
                  styles.specialKey,
                  {
                    backgroundColor: theme.success,
                    borderColor: theme.success,
                    width: KEY_WIDTH * 1.5,
                    height: KEY_HEIGHT,
                    transform: [{ scale: pressed && !disabled ? 0.90 : 1 }],
                    opacity: disabled ? 0.55 : 1,
                  },
                ]}
              >
                <CheckIcon color="#FFFFFF" />
              </Pressable>
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
              <Pressable
                disabled={disabled}
                onPress={onDelete}
                style={({ pressed }) => [
                  styles.key,
                  styles.specialKey,
                  {
                    backgroundColor: theme.error + '25',
                    borderColor: theme.border,
                    width: KEY_WIDTH * 1.5,
                    height: KEY_HEIGHT,
                    transform: [{ scale: pressed && !disabled ? 0.90 : 1 }],
                    opacity: disabled ? 0.55 : 1,
                  },
                ]}
              >
                <DeleteIcon color={theme.error} />
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );
});

export default SpellingKeyboard;

const styles = StyleSheet.create({
  container: {
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
