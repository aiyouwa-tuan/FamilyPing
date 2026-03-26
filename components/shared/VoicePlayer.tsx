import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

interface Props {
  uri: string;
  duration: number;
}

export default function VoicePlayer({ uri, duration }: Props) {
  const secs = Math.round(duration / 1000);
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn}>
        <Text style={styles.icon}>▶️</Text>
      </TouchableOpacity>
      <Text style={styles.time}>{secs}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 16 },
  time: { fontSize: 14, color: colors.textLight },
});
