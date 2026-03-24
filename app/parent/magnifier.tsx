import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

export default function MagnifierScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0); // 0-1 normalized for CameraView
  const [zoomDisplay, setZoomDisplay] = useState(1); // 1x-5x for display
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo) {
        setPhotoUri(photo.uri);
      }
    } catch {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };

  const handleReadAloud = () => {
    Alert.alert(
      'Read Aloud',
      'OCR text would appear here.\n\nIn the full version, AI will read detected text aloud using text-to-speech.',
      [{ text: 'OK' }]
    );
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleZoomChange = (value: number) => {
    // Map slider 1-5 to camera zoom 0-1
    const normalized = (value - 1) / 4;
    setZoom(normalized);
    setZoomDisplay(Math.round(value * 10) / 10);
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.permText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.permEmoji}>{'\uD83D\uDCF7'}</Text>
          <Text style={styles.permText}>Camera access is needed for the magnifier.</Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'\u2190'} Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Photo review mode
  if (photoUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.reviewContainer}>
          {/* Header */}
          <TouchableOpacity onPress={handleRetake} style={styles.headerRow}>
            <Text style={styles.headerBack}>{'\u2190'} Retake</Text>
          </TouchableOpacity>

          {/* Photo */}
          <View style={[styles.photoWrapper, highContrast && styles.invertedPhoto]}>
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="contain"
            />
          </View>

          {/* Controls */}
          <View style={styles.reviewControls}>
            <TouchableOpacity
              style={styles.readAloudButton}
              onPress={handleReadAloud}
              activeOpacity={0.7}
            >
              <Text style={styles.readAloudEmoji}>{'\uD83D\uDD0A'}</Text>
              <Text style={styles.readAloudText}>Read Aloud</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.contrastToggle,
                highContrast && styles.contrastToggleActive,
              ]}
              onPress={() => setHighContrast(!highContrast)}
              activeOpacity={0.7}
            >
              <Text style={styles.contrastEmoji}>{highContrast ? '\u2600\uFE0F' : '\uD83C\uDF13'}</Text>
              <Text
                style={[
                  styles.contrastText,
                  highContrast && styles.contrastTextActive,
                ]}
              >
                {highContrast ? 'Normal' : 'High Contrast'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera live view
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.cameraContainer}>
        {/* Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerRow}>
            <Text style={styles.headerBack}>{'\u2190'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>{'\uD83D\uDD0D'} Magnifier</Text>
        </View>

        {/* Camera */}
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            zoom={zoom}
            facing="back"
          />
        </View>

        {/* Zoom slider */}
        <View style={styles.zoomRow}>
          <Text style={styles.zoomLabel}>1x</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={0.1}
            value={zoomDisplay}
            onValueChange={handleZoomChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.zoomLabel}>5x</Text>
        </View>
        <Text style={styles.zoomValue}>{zoomDisplay.toFixed(1)}x</Text>

        {/* Capture button */}
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
          activeOpacity={0.7}
          accessibilityLabel="Take Photo"
          accessibilityRole="button"
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  permEmoji: {
    fontSize: 64,
  },
  permText: {
    fontSize: fonts.parentBody,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  permButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 64,
    justifyContent: 'center',
  },
  permButtonText: {
    fontSize: fonts.parentButton,
    fontWeight: '700',
    color: colors.white,
  },
  backBtn: {
    paddingVertical: spacing.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: fonts.parentBody,
    color: colors.primary,
    fontWeight: '600',
  },

  // Camera view
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    minHeight: 64,
    justifyContent: 'center',
  },
  headerBack: {
    fontSize: fonts.parentBody,
    color: colors.primary,
    fontWeight: '600',
  },
  cameraTitle: {
    fontSize: fonts.parentTitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  slider: {
    flex: 1,
    height: 48,
    marginHorizontal: spacing.sm,
  },
  zoomLabel: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  zoomValue: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
  },
  captureButton: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  captureInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    borderWidth: 5,
    borderColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Review mode
  reviewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photoWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  invertedPhoto: {
    transform: [{ scaleX: 1 }],
    // High contrast: dark background, inverted look via tintColor on Image is limited.
    // We use a dark bg + image filter approach. For RN, we invert via style.
    backgroundColor: '#000',
  },
  photo: {
    flex: 1,
    width: '100%',
  },
  reviewControls: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  readAloudButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    gap: spacing.sm,
  },
  readAloudEmoji: {
    fontSize: 28,
  },
  readAloudText: {
    fontSize: fonts.parentButton,
    fontWeight: '700',
    color: colors.white,
  },
  contrastToggle: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  contrastToggleActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  contrastEmoji: {
    fontSize: 28,
  },
  contrastText: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
    color: colors.text,
  },
  contrastTextActive: {
    color: colors.white,
  },
});
