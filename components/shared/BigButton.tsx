import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, fonts } from '../../lib/theme';

interface BigButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'normal' | 'large';
  emoji?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function BigButton({
  title,
  onPress,
  variant = 'primary',
  size = 'normal',
  emoji,
  style,
  textStyle,
  disabled = false,
}: BigButtonProps) {
  const bgColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    danger: colors.danger,
    outline: 'transparent',
  }[variant];

  const txtColor = variant === 'outline' ? colors.primary : colors.white;
  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          paddingVertical: isLarge ? spacing.lg : spacing.md,
          paddingHorizontal: isLarge ? spacing.xl : spacing.lg,
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: colors.primary,
          opacity: disabled ? 0.5 : 1,
          minHeight: isLarge ? 72 : 52,
        },
        style,
      ]}
    >
      {emoji && <Text style={[styles.emoji, { fontSize: isLarge ? 36 : 24 }]}>{emoji}</Text>}
      <Text
        style={[
          styles.text,
          { color: txtColor, fontSize: isLarge ? fonts.parentButton : fonts.body },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emoji: {
    textAlign: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
