import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface PhotoPickerProps {
  onPhotoSelected: (uri: string) => void;
  maxSize?: number;
}

export default function PhotoPicker({ onPhotoSelected, maxSize }: PhotoPickerProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      onPhotoSelected(uri);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      onPhotoSelected(uri);
    }
  };

  const clearPreview = () => {
    setPreviewUri(null);
  };

  if (previewUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: previewUri }} style={styles.preview} />
        <TouchableOpacity style={styles.clearButton} onPress={clearPreview}>
          <Text style={styles.clearText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickFromCamera}>
        <Text style={styles.buttonIcon}>📷</Text>
        <Text style={styles.buttonLabel}>Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.galleryButton]} onPress={pickFromGallery}>
        <Text style={styles.buttonIcon}>🖼️</Text>
        <Text style={styles.buttonLabel}>Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  galleryButton: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonLabel: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  clearButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
});
