import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface MedicalInfo {
  name: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string;
  medications: string;
  emergencyContact: string;
  doctorName: string;
  doctorPhone: string;
  insuranceInfo: string;
  notes: string;
}

const EMPTY_INFO: MedicalInfo = {
  name: '',
  dateOfBirth: '',
  bloodType: '',
  allergies: '',
  medications: '',
  emergencyContact: '',
  doctorName: '',
  doctorPhone: '',
  insuranceInfo: '',
  notes: '',
};

// Mock AsyncStorage for demo purposes
let savedData: MedicalInfo | null = null;

export default function MedicalCardScreen() {
  const router = useRouter();
  const [info, setInfo] = useState<MedicalInfo>(EMPTY_INFO);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from mock storage
    if (savedData) {
      setInfo(savedData);
    }
  }, []);

  const updateField = (field: keyof MedicalInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    savedData = { ...info };
    setSaved(true);
    Alert.alert('Saved', 'Medical card has been saved.', [{ text: 'OK' }]);
    setTimeout(() => setSaved(false), 3000);
  };

  const fields: { key: keyof MedicalInfo; label: string; placeholder: string; multiline?: boolean }[] = [
    { key: 'name', label: 'Full Name', placeholder: 'Enter full name' },
    { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'MM/DD/YYYY' },
    { key: 'bloodType', label: 'Blood Type', placeholder: 'e.g. A+, O-, B+' },
    { key: 'allergies', label: 'Allergies', placeholder: 'List any allergies', multiline: true },
    { key: 'medications', label: 'Current Medications', placeholder: 'List medications and dosages', multiline: true },
    { key: 'emergencyContact', label: 'Emergency Contact', placeholder: 'Name and phone number' },
    { key: 'doctorName', label: "Doctor's Name", placeholder: "Enter doctor's name" },
    { key: 'doctorPhone', label: "Doctor's Phone", placeholder: "Enter doctor's phone" },
    { key: 'insuranceInfo', label: 'Insurance Info', placeholder: 'Provider and policy number', multiline: true },
    { key: 'notes', label: 'Additional Notes', placeholder: 'Any other important medical info', multiline: true },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Card</Text>
          <View style={styles.backButton} />
        </View>

        {/* Medical cross icon */}
        <View style={styles.iconRow}>
          <View style={styles.crossContainer}>
            <View style={styles.crossVertical} />
            <View style={styles.crossHorizontal} />
          </View>
          <Text style={styles.iconLabel}>Emergency Medical Card</Text>
        </View>

        {/* Info text */}
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>
            This card can be shown to emergency responders
          </Text>
        </View>

        {/* Fields */}
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={[styles.fieldInput, field.multiline && styles.fieldMultiline]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textLight}
              value={info[field.key]}
              onChangeText={(val) => updateField(field.key, val)}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 3 : 1}
              textAlignVertical={field.multiline ? 'top' : 'center'}
            />
          </View>
        ))}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saved && styles.saveButtonDone]}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>
            {saved ? '\u2705 Saved' : 'Save Medical Card'}
          </Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: spacing.xxl }} />
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: colors.text,
  },
  headerTitle: {
    fontSize: fonts.parentTitle,
    fontWeight: '800',
    color: colors.text,
  },
  iconRow: {
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  crossContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 18,
    height: 54,
    backgroundColor: colors.danger,
    borderRadius: 4,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 54,
    height: 18,
    backgroundColor: colors.danger,
    borderRadius: 4,
  },
  iconLabel: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.danger,
  },
  infoBar: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  infoText: {
    fontSize: fonts.parentSmall,
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldContainer: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.text,
  },
  fieldInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 20,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  fieldMultiline: {
    minHeight: 90,
    paddingTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDone: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  saveButtonText: {
    fontSize: fonts.parentButton,
    fontWeight: '700',
    color: colors.white,
  },
});
