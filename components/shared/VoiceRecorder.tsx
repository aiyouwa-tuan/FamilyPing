import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface VoiceRecorderProps {
  onRecordComplete: (uri: string, duration: number) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecordComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (disabled) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      recordingRef.current = null;
      setIsRecording(false);
      setDuration(0);

      if (uri) {
        onRecordComplete(uri, finalDuration);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
      setDuration(0);
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={styles.recordingDot} />
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}
      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          isRecording && styles.buttonRecording,
          pressed && !disabled && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonIcon}>{isRecording ? '||' : '🎤'}</Text>
      </Pressable>
      {!isRecording && (
        <Text style={styles.hint}>Hold to record</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  durationText: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.danger,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonRecording: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    transform: [{ scale: 1.1 }],
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    backgroundColor: colors.textLight,
    shadowOpacity: 0,
  },
  buttonIcon: {
    fontSize: 28,
    color: colors.white,
  },
  hint: {
    fontSize: fonts.tiny,
    color: colors.textLight,
  },
});
