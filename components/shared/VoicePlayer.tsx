import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface VoicePlayerProps {
  uri: string;
  duration: number;
}

export default function VoicePlayer({ uri, duration }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(Math.floor((status.positionMillis || 0) / 1000));
            if (status.durationMillis) {
              setTotalDuration(Math.floor(status.durationMillis / 1000));
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              soundRef.current?.setPositionAsync(0);
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  const progress = totalDuration > 0 ? position / totalDuration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
        <Text style={styles.playIcon}>{isPlaying ? '||' : '>'}</Text>
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.timeText}>
          {formatTime(position)} / {formatTime(totalDuration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  progressContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timeText: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
  },
});
