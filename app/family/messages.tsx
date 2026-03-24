import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore, useFamilyStore } from '../../lib/store';
import type { Message } from '../../lib/types';
import VoiceRecorder from '../../components/shared/VoiceRecorder';
import VoicePlayer from '../../components/shared/VoicePlayer';

type Channel = 'all' | 'family_chat';

// Mock messages for demo
const mockMessages: (Message & { channel: Channel })[] = [
  {
    id: 'msg-101',
    family_id: 'fam-001',
    sender_id: 'user-parent-001',
    recipient_role: 'all',
    content: 'Good morning everyone! I made pancakes today.',
    message_type: 'text',
    media_url: null,
    read_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    channel: 'all',
  },
  {
    id: 'msg-102',
    family_id: 'fam-001',
    sender_id: 'user-family-001',
    recipient_role: 'all',
    content: 'Love you Mom! Save me some!',
    message_type: 'text',
    media_url: null,
    read_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    channel: 'all',
  },
  {
    id: 'msg-103',
    family_id: 'fam-001',
    sender_id: 'user-family-002',
    recipient_role: 'family',
    content: 'Hey Sarah, should we plan something for Mom\'s birthday?',
    message_type: 'text',
    media_url: null,
    read_at: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    channel: 'family_chat',
  },
  {
    id: 'msg-104',
    family_id: 'fam-001',
    sender_id: 'user-family-001',
    recipient_role: 'family',
    content: 'Yes! Let\'s do a surprise dinner. I\'ll book a restaurant.',
    message_type: 'text',
    media_url: null,
    read_at: null,
    created_at: new Date(Date.now() - 900000).toISOString(),
    channel: 'family_chat',
  },
];

const senderNames: Record<string, { name: string; emoji: string }> = {
  'user-parent-001': { name: 'Mom', emoji: '👵' },
  'user-family-001': { name: 'Sarah', emoji: '👩' },
  'user-family-002': { name: 'James', emoji: '👨' },
};

export default function FamilyMessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activeChannel, setActiveChannel] = useState<Channel>('all');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [showAttachments, setShowAttachments] = useState(false);

  const filteredMessages = messages.filter((m) => m.channel === activeChannel);

  const handleSendText = () => {
    if (!messageText.trim()) return;
    const newMsg: Message & { channel: Channel } = {
      id: `msg-${Date.now()}`,
      family_id: user?.family_id || 'fam-001',
      sender_id: user?.id || 'user-family-001',
      recipient_role: activeChannel === 'family_chat' ? 'family' : 'all',
      content: messageText.trim(),
      message_type: 'text',
      media_url: null,
      read_at: null,
      created_at: new Date().toISOString(),
      channel: activeChannel,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessageText('');
  };

  const handleVoiceComplete = (uri: string, duration: number) => {
    const newMsg: Message & { channel: Channel } = {
      id: `msg-${Date.now()}`,
      family_id: user?.family_id || 'fam-001',
      sender_id: user?.id || 'user-family-001',
      recipient_role: activeChannel === 'family_chat' ? 'family' : 'all',
      content: `Voice message (${duration}s)`,
      message_type: 'voice',
      media_url: uri,
      read_at: null,
      created_at: new Date().toISOString(),
      channel: activeChannel,
    };
    setMessages((prev) => [...prev, newMsg]);
    setShowAttachments(false);
  };

  const handlePhotoSelected = (uri: string) => {
    const newMsg: Message & { channel: Channel } = {
      id: `msg-${Date.now()}`,
      family_id: user?.family_id || 'fam-001',
      sender_id: user?.id || 'user-family-001',
      recipient_role: activeChannel === 'family_chat' ? 'family' : 'all',
      content: 'Photo',
      message_type: 'photo',
      media_url: uri,
      read_at: null,
      created_at: new Date().toISOString(),
      channel: activeChannel,
    };
    setMessages((prev) => [...prev, newMsg]);
    setShowAttachments(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isOwnMessage = (senderId: string) => senderId === (user?.id || 'user-family-001');

  const renderMessage = (msg: Message & { channel: Channel }) => {
    const own = isOwnMessage(msg.sender_id);
    const sender = senderNames[msg.sender_id] || { name: 'Unknown', emoji: '👤' };

    return (
      <View
        key={msg.id}
        style={[styles.messageBubbleRow, own && styles.messageBubbleRowOwn]}
      >
        {!own && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>{sender.emoji}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, own ? styles.ownBubble : styles.otherBubble]}>
          {!own && <Text style={styles.senderName}>{sender.name}</Text>}

          {msg.message_type === 'text' && (
            <Text style={[styles.messageContent, own && styles.ownMessageContent]}>
              {msg.content}
            </Text>
          )}

          {msg.message_type === 'voice' && msg.media_url && (
            <VoicePlayer uri={msg.media_url} duration={10} />
          )}

          {msg.message_type === 'photo' && msg.media_url && (
            <Image source={{ uri: msg.media_url }} style={styles.photoMessage} />
          )}

          <Text style={[styles.messageTime, own && styles.ownMessageTime]}>
            {formatTime(msg.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Channel Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeChannel === 'all' && styles.tabActive]}
            onPress={() => setActiveChannel('all')}
          >
            <Text style={[styles.tabText, activeChannel === 'all' && styles.tabTextActive]}>
              All Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeChannel === 'family_chat' && styles.tabActive]}
            onPress={() => setActiveChannel('family_chat')}
          >
            <Text style={[styles.tabText, activeChannel === 'family_chat' && styles.tabTextActive]}>
              Family Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Banner for Family Chat */}
        {activeChannel === 'family_chat' && (
          <View style={styles.privacyBanner}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>Parents can't see this</Text>
          </View>
        )}

        {/* Messages List */}
        <ScrollView
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            filteredMessages.map(renderMessage)
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachments(!showAttachments)}
          >
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textLight}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          {messageText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSendText}>
              <Text style={styles.sendIcon}>{'>'}</Text>
            </TouchableOpacity>
          ) : (
            <VoiceRecorder onRecordComplete={handleVoiceComplete} />
          )}
        </View>

        {/* Attachment Options */}
        {showAttachments && (
          <View style={styles.attachmentPanel}>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => {
                Alert.alert('Photo', 'Camera/Gallery picker would open here.');
                setShowAttachments(false);
              }}
            >
              <Text style={styles.attachOptionIcon}>📷</Text>
              <Text style={styles.attachOptionLabel}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => {
                setShowAttachments(false);
              }}
            >
              <Text style={styles.attachOptionIcon}>🎤</Text>
              <Text style={styles.attachOptionLabel}>Voice</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    fontSize: fonts.body,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondaryLight,
    paddingVertical: spacing.sm,
  },
  privacyIcon: {
    fontSize: 14,
  },
  privacyText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.secondary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: fonts.subtitle,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fonts.body,
    color: colors.textSecondary,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  messageBubbleRowOwn: {
    flexDirection: 'row-reverse',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  senderName: {
    fontSize: fonts.tiny,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  messageContent: {
    fontSize: fonts.body,
    color: colors.text,
    lineHeight: 22,
  },
  ownMessageContent: {
    color: colors.white,
  },
  photoMessage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  messageTime: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textSecondary,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.body,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  attachmentPanel: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachOption: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    minWidth: 80,
  },
  attachOptionIcon: {
    fontSize: 28,
  },
  attachOptionLabel: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
