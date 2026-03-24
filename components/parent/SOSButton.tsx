import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface SOSButtonProps {
  onTrigger: () => void;
}

export default function SOSButton({ onTrigger }: SOSButtonProps) {
  const [pressing, setPressing] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setPressing(true);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setTriggered(true);
        onTrigger();
      }
    });
  };

  const handlePressOut = () => {
    setPressing(false);
    if (!triggered) {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  };

  if (triggered) {
    return (
      <View style={[styles.button, styles.triggered]}>
        <Text style={styles.emoji}>🚨</Text>
        <Text style={styles.triggeredText}>SOS Sent!</Text>
        <Text style={styles.subText}>Your family has been notified</Text>
      </View>
    );
  }

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, pressing && styles.pressing]}
      >
        <Animated.View
          style={[
            styles.progress,
            { width: widthInterpolation },
          ]}
        />
        <Text style={styles.emoji}>🆘</Text>
        <Text style={styles.text}>Hold for Emergency</Text>
        <Text style={styles.hint}>Hold 3 seconds to send SOS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
  },
  button: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger,
    overflow: 'hidden',
    position: 'relative',
  },
  pressing: {
    backgroundColor: '#F5C6CB',
  },
  triggered: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.danger,
  },
  hint: {
    fontSize: 14,
    color: colors.danger,
    opacity: 0.7,
    marginTop: 2,
  },
  triggeredText: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.white,
  },
  subText: {
    fontSize: fonts.parentSmall,
    color: colors.white,
    opacity: 0.9,
  },
});
