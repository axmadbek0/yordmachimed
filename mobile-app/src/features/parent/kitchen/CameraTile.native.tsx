/**
 * CameraTile.native.tsx — React Native kamera katakchasi (Oshxona / Yotoqxona)
 * Veb CameraTile mantiqiga 100% mos (bir xil props va ma'lumotlar strukturasi)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';

export interface CameraTileNativeProps {
  cameraLabel: string;
  sectorLabel: string;
  status: 'FAOL' | 'FAOL EMAS';
  isLive: boolean;
  timestamp?: string;
  thumbnailUrl?: string;
  onPress?: () => void;
  /** Veb bilan moslik uchun alias */
  onClick?: () => void;
}

export const CameraTileNative: React.FC<CameraTileNativeProps> = ({
  cameraLabel,
  sectorLabel,
  status,
  isLive,
  timestamp,
  thumbnailUrl,
  onPress,
  onClick,
}) => {
  const handlePress = onPress || onClick;
  const isActive = status === 'FAOL';

  const currentTime =
    timestamp ||
    new Date().toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${cameraLabel}, ${sectorLabel}`}
    >
      {/* Video / Thumbnail preview */}
      <View style={styles.previewContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.cameraIconPlaceholder}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </View>
        )}

        {/* LIVE Badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.timestampBadge}>
          <Text style={styles.timestampText}>{currentTime}</Text>
        </View>

        {/* Dark gradient overlay simulation */}
        <View style={styles.bottomShadowOverlay} />
      </View>

      {/* Info Row */}
      <View style={styles.infoContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.cameraLabel} numberOfLines={1}>
            {cameraLabel}
          </Text>
          <Text style={styles.sectorLabel} numberOfLines={1}>
            {sectorLabel}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isActive ? styles.statusTextActive : styles.statusTextInactive,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CameraTileNative;

const { width } = Dimensions.get('window');
const itemWidth = (width - 44) / 2;

const styles = StyleSheet.create({
  card: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D3E6F5',
    marginBottom: 12,
    shadowColor: '#123C5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#0A1A28',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F273D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconText: {
    fontSize: 20,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  timestampBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  bottomShadowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  infoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
  },
  cameraLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#123C5C',
  },
  sectorLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
  },
  statusBadgeInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#9CA3AF',
  },
});
