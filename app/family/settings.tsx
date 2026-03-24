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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';

const EMOJI_OPTIONS = ['👩', '👨', '👧', '👦', '🧑', '💛', '🌟', '🏠', '🌸'];

export default function FamilySettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(user?.name || '');
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatar_emoji || '👩');
  const [alertDelay, setAlertDelay] = useState(
    (user?.alert_delay_minutes || 120).toString()
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [missedCheckinAlerts, setMissedCheckinAlerts] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);

  const handleSave = () => {
    Alert.alert('Saved!', 'Your settings have been updated.');
  };

  const handleCopyInviteCode = async () => {
    if (family?.invite_code) {
      await Clipboard.setStringAsync(family.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
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

  const planLabel: Record<string, string> = {
    free: 'Free',
    family: 'Family',
    smart: 'Smart',
    premium: 'Premium',
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

        {/* Alert Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Alert Delay (minutes)</Text>
              <Text style={styles.fieldHint}>
                How long after a missed check-in before you get notified
              </Text>
              <View style={styles.delayRow}>
                {['30', '60', '120', '180'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.delayChip,
                      alertDelay === val && styles.delayChipSelected,
                    ]}
                    onPress={() => setAlertDelay(val)}
                  >
                    <Text
                      style={[
                        styles.delayChipText,
                        alertDelay === val && styles.delayChipTextSelected,
                      ]}
                    >
                      {parseInt(val, 10) >= 60
                        ? `${parseInt(val, 10) / 60}h`
                        : `${val}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDesc}>All notifications</Text>
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
                <Text style={styles.settingLabel}>Missed Check-in Alerts</Text>
                <Text style={styles.settingDesc}>
                  Get notified when parent misses check-in
                </Text>
              </View>
              <Switch
                value={missedCheckinAlerts}
                onValueChange={setMissedCheckinAlerts}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>SOS Alerts</Text>
                <Text style={styles.settingDesc}>
                  Emergency alerts (recommended: always on)
                </Text>
              </View>
              <Switch
                value={sosAlerts}
                onValueChange={setSosAlerts}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Manage Family */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Family</Text>
          <View style={styles.card}>
            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>
                {family?.name || 'My Family'}
              </Text>
              <View style={styles.inviteCodeRow}>
                <Text style={styles.inviteLabel}>Invite Code:</Text>
                <Text style={styles.inviteCode}>
                  {family?.invite_code || '---'}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyInviteCode}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan</Text>
          <View style={styles.card}>
            <View style={styles.planRow}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>
                  {planLabel[family?.plan || 'free']} Plan
                </Text>
                <Text style={styles.planDesc}>
                  {family?.plan === 'free'
                    ? '1 parent, basic features'
                    : 'Full family features'}
                </Text>
              </View>
              {family?.plan === 'free' && (
                <TouchableOpacity style={styles.upgradeBadge}>
                  <Text style={styles.upgradeBadgeText}>Upgrade</Text>
                </TouchableOpacity>
              )}
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
    fontSize: fonts.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  saveText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.small,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 40,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldHint: {
    fontSize: fonts.tiny,
    color: colors.textLight,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.body,
    color: colors.text,
  },
  delayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  delayChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  delayChipSelected: {
    backgroundColor: colors.primary,
  },
  delayChipText: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  delayChipTextSelected: {
    color: colors.white,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.text,
  },
  settingDesc: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  familyInfo: {
    gap: spacing.md,
  },
  familyName: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inviteLabel: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  inviteCode: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    flex: 1,
  },
  copyButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  copyButtonText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.primary,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.text,
  },
  planDesc: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upgradeBadge: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  upgradeBadgeText: {
    fontSize: fonts.small,
    fontWeight: '700',
    color: colors.warning,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  aboutLabel: {
    fontSize: fonts.body,
    color: colors.text,
  },
  aboutValue: {
    fontSize: fonts.body,
    color: colors.textSecondary,
  },
  aboutChevron: {
    fontSize: fonts.subtitle,
    color: colors.textLight,
  },
  logoutButton: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.danger,
  },
});
