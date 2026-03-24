import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';

const EMOJI_OPTIONS = ['👵', '👴', '🧓', '👩', '👨', '😊', '💛', '🌸', '🏠'];

export default function ParentSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initialHour = user?.checkin_time ? parseInt(user.checkin_time.split(':')[0], 10) : 9;
  const initialMin = user?.checkin_time ? parseInt(user.checkin_time.split(':')[1], 10) : 0;

  const [name, setName] = useState(user?.name || '');
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatar_emoji || '👵');
  const [checkinTime, setCheckinTime] = useState(
    new Date(2000, 0, 1, initialHour, initialMin)
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleTimeChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setCheckinTime(selectedDate);
    }
  };

  const handleSave = () => {
    Alert.alert('Saved!', 'Your settings have been updated.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{avatarEmoji}</Text>
              </View>
              <View style={styles.emojiRow}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      avatarEmoji === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => setAvatarEmoji(emoji)}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        </View>

        {/* Check-in Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in Time</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeIcon}>⏰</Text>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Daily check-in</Text>
                <Text style={styles.timeValue}>{formatTime(checkinTime)}</Text>
              </View>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={checkinTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  minuteInterval={5}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.pickerDone}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Check-in reminders</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Text style={styles.settingDesc}>Notification sounds</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Text style={styles.aboutChevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Text style={styles.aboutChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  backText: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: fonts.parentBody,
    fontWeight: '800',
    color: colors.text,
  },
  saveText: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 48,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emojiOptionText: {
    fontSize: 24,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fonts.parentSmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.parentBody,
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeIcon: {
    fontSize: 32,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
  },
  timeValue: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.text,
  },
  changeText: {
    fontSize: fonts.parentSmall,
    fontWeight: '600',
    color: colors.primary,
  },
  pickerContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  pickerDone: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pickerDoneText: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fonts.parentSmall,
    fontWeight: '600',
    color: colors.text,
  },
  settingDesc: {
    fontSize: fonts.parentSmall - 2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  aboutLabel: {
    fontSize: fonts.parentSmall,
    color: colors.text,
  },
  aboutValue: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
  },
  aboutChevron: {
    fontSize: fonts.parentBody,
    color: colors.textLight,
  },
  logoutButton: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.danger,
  },
});
