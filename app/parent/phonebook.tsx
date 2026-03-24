import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface FamilyContact {
  id: string;
  name: string;
  phone: string;
  avatar_emoji: string;
  relation: string;
}

interface EmergencyContact {
  label: string;
  phone: string;
  emoji: string;
}

const FAMILY_CONTACTS: FamilyContact[] = [
  { id: '1', name: 'Sarah', phone: '+15551234567', avatar_emoji: '\uD83D\uDC69', relation: 'Daughter' },
  { id: '2', name: 'David', phone: '+15559876543', avatar_emoji: '\uD83D\uDC68', relation: 'Son' },
  { id: '3', name: 'Emily', phone: '+15555551234', avatar_emoji: '\uD83D\uDC67', relation: 'Granddaughter' },
  { id: '4', name: 'Michael', phone: '+15555559876', avatar_emoji: '\uD83E\uDDD4', relation: 'Husband' },
  { id: '5', name: 'Linda', phone: '+15553334444', avatar_emoji: '\uD83D\uDC69\u200D\uD83E\uDDB3', relation: 'Sister' },
];

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { label: 'Police', phone: '911', emoji: '\uD83D\uDE93' },
  { label: 'Fire', phone: '911', emoji: '\uD83D\uDE92' },
  { label: 'Ambulance', phone: '911', emoji: '\uD83D\uDE91' },
  { label: 'Poison Control', phone: '18002221222', emoji: '\u2622\uFE0F' },
];

function callNumber(phone: string, name: string) {
  const url = `tel:${phone}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Cannot Call', `Unable to open phone dialer for ${name}.`);
      }
    })
    .catch(() => {
      Alert.alert('Error', 'Something went wrong trying to make the call.');
    });
}

function FamilyCard({ contact }: { contact: FamilyContact }) {
  return (
    <View style={styles.familyCard}>
      <View style={styles.cardLeft}>
        <Text style={styles.avatar}>{contact.avatar_emoji}</Text>
        <View style={styles.nameBlock}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.relation}>{contact.relation}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.callButton}
        onPress={() => callNumber(contact.phone, contact.name)}
        activeOpacity={0.7}
        accessibilityLabel={`Call ${contact.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.callButtonEmoji}>{'\uD83D\uDCDE'}</Text>
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmergencyCard({ contact }: { contact: EmergencyContact }) {
  return (
    <TouchableOpacity
      style={styles.emergencyCard}
      onPress={() => callNumber(contact.phone, contact.label)}
      activeOpacity={0.7}
      accessibilityLabel={`Call ${contact.label}`}
      accessibilityRole="button"
    >
      <Text style={styles.emergencyEmoji}>{contact.emoji}</Text>
      <Text style={styles.emergencyLabel}>{contact.label}</Text>
    </TouchableOpacity>
  );
}

export default function PhonebookScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{'\uD83D\uDCDE'} Phonebook</Text>

        {/* Family Members */}
        <Text style={styles.sectionTitle}>Family</Text>
        {FAMILY_CONTACTS.map((contact) => (
          <FamilyCard key={contact.id} contact={contact} />
        ))}

        {/* Emergency Numbers */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
          Emergency Numbers
        </Text>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <EmergencyCard key={index} contact={contact} />
          ))}
        </View>
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
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 64,
  },
  backArrow: {
    fontSize: fonts.parentBody,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  backLabel: {
    fontSize: fonts.parentBody,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: fonts.parentTitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  familyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  nameBlock: {
    flex: 1,
  },
  contactName: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.text,
  },
  relation: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    minWidth: 110,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  callButtonEmoji: {
    fontSize: 24,
  },
  callButtonText: {
    fontSize: fonts.parentButton,
    fontWeight: '700',
    color: colors.white,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  emergencyCard: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.danger,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    width: '47%',
    gap: spacing.sm,
  },
  emergencyEmoji: {
    fontSize: 36,
  },
  emergencyLabel: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.danger,
    textAlign: 'center',
  },
});
