import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  const handleSendCode = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }
    setSending(true);
    // Mock sending code
    setTimeout(() => {
      setSending(false);
      setCodeSent(true);
    }, 1200);
  };

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const codeStr = fullCode || code.join('');
    if (codeStr.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }
    setVerifying(true);
    // Mock verification - decide role based on code
    setTimeout(() => {
      setVerifying(false);
      // Mock: code "111111" goes to register (new family member), anything else goes to join (parent)
      // In reality, the server would determine if this is a new or existing user
      Alert.alert(
        'Welcome!',
        'How would you like to use FamilyPing?',
        [
          {
            text: 'Set up my family',
            onPress: () => router.replace('/(auth)/register'),
          },
          {
            text: 'Join a family',
            onPress: () => router.replace('/(auth)/join'),
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📱</Text>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            {codeSent
              ? 'Enter the 6-digit code we sent to your phone'
              : 'Enter your phone number to get started'}
          </Text>
        </View>

        {/* Phone Input */}
        {!codeSent && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              maxLength={15}
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                phone.length < 10 && styles.buttonDisabled,
              ]}
              onPress={handleSendCode}
              disabled={phone.length < 10 || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Code Input */}
        {codeSent && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(value) =>
                    handleCodeChange(value.replace(/[^0-9]/g, '').slice(-1), index)
                  }
                  onKeyPress={({ nativeEvent }) =>
                    handleCodeKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                code.join('').length !== 6 && styles.buttonDisabled,
              ]}
              onPress={() => handleVerify()}
              disabled={code.join('').length !== 6 || verifying}
              activeOpacity={0.8}
            >
              {verifying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setCode(['', '', '', '', '', '']);
                Alert.alert('Code Resent', 'A new code has been sent to your phone.');
              }}
            >
              <Text style={styles.resendText}>Didn't get a code? Resend</Text>
            </TouchableOpacity>
          </View>
        )}
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
  backButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: fonts.body,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  inputSection: {
    gap: spacing.md,
  },
  label: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fonts.subtitle,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: fonts.title,
    fontWeight: '700',
    color: colors.text,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.white,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resendText: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
});
