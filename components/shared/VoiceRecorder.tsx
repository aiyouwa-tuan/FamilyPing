import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

interface Props {
  onRecordComplete?: (uri: string, duration: number) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecordComplete, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.disabled]}
      disabled={disabled}
      onPress={() => onRecordComplete?.('mock://voice.m4a', 5000)}
    >
      <Text style={styles.icon}>🎤</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.4 },
  icon: { fontSize: 22 },
});
