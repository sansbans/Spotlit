import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface Props {
  uri: string | null;
  onCapture: (uri: string) => void;
  onClear?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: object;
}

const SIZES = {
  sm: 120,
  md: 200,
  lg: 280,
} as const;

export function PhotoCapture({
  uri,
  onCapture,
  onClear,
  label = 'Add Photo',
  size = 'md',
  style,
}: Props) {
  const height = SIZES[size];

  const pickImage = async (source: 'camera' | 'library') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera access is required to take photos of your patch.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Photo library access is required to pick a photo.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });
    }

    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  };

  const showOptions = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (uri) {
    return (
      <View style={[styles.previewContainer, { height }, style]}>
        <Image source={{ uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <Pressable style={styles.changeBtn} onPress={showOptions}>
            <Ionicons name="camera" size={16} color={Colors.textInverse} />
            <Text style={styles.changeBtnText}>Change</Text>
          </Pressable>
          {onClear && (
            <Pressable style={styles.clearBtn} onPress={onClear}>
              <Ionicons name="trash" size={16} color={Colors.error} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.placeholder, { height }, pressed && styles.pressed, style]}
      onPress={showOptions}
    >
      <View style={styles.placeholderInner}>
        <View style={styles.cameraIcon}>
          <Ionicons name="camera-outline" size={size === 'sm' ? 24 : 36} color={Colors.secondary} />
        </View>
        <Text style={styles.placeholderLabel}>{label}</Text>
        <Text style={styles.placeholderHint}>Tap to take or upload a photo</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  placeholderInner: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cameraIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  placeholderHint: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  previewContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewActions: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  changeBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
