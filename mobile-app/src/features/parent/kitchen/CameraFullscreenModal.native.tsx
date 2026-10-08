/**
 * CameraFullscreenModal.native.tsx — React Native To'liq ekranli kamera ko'rish modali
 * Chap / o'ng svayp va tugmalar orqali kameralar orasida almashish
 */

import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  PanResponder,
  StatusBar,
} from 'react-native';
import type { CameraFeedItem } from '../../../types/foodAnalysis';

interface CameraFullscreenModalNativeProps {
  visible: boolean;
  cameras: CameraFeedItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (delta: number) => void;
  timestamp?: string;
}

export const CameraFullscreenModalNative: React.FC<CameraFullscreenModalNativeProps> = ({
  visible,
  cameras,
  activeIndex,
  onClose,
  onNavigate,
  timestamp,
}) => {
  const isOpen = visible && activeIndex !== null && cameras.length > 0;
  const currentCamera = isOpen ? cameras[activeIndex] : null;

  // Swipe gesture handling with PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 60) {
          // Swipe Right -> Previous camera
          onNavigate(-1);
        } else if (gestureState.dx < -60) {
          // Swipe Left -> Next camera
          onNavigate(1);
        }
      },
    })
  ).current;

  if (!isOpen || !currentCamera) return null;

  const timeLabel =
    timestamp ||
    new Date().toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <Modal
      visible={isOpen}
      transparent={false}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Header Controls */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentCamera.cameraLabel}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentCamera.sectorLabel}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Yopish"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Video / Camera View with Gesture detection */}
        <View style={styles.contentArea} {...panResponder.panHandlers}>
          <View style={styles.videoContainer}>
            {currentCamera.thumbnailUrl ? (
              <Image
                source={{ uri: currentCamera.thumbnailUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderIcon}>📹</Text>
                <Text style={styles.videoPlaceholderText}>
                  {currentCamera.cameraLabel} jonli uzatmasi
                </Text>
              </View>
            )}

            {/* LIVE Badge */}
            {currentCamera.isLive && (
              <View style={styles.liveOverlay}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}

            {/* Timestamp Badge */}
            <View style={styles.timestampOverlay}>
              <Text style={styles.timestampText}>{timeLabel}</Text>
            </View>

            {/* Left Nav Button */}
            {cameras.length > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={() => onNavigate(-1)}
                activeOpacity={0.7}
                accessibilityLabel="Oldingi kamera"
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
            )}

            {/* Right Nav Button */}
            {cameras.length > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={() => onNavigate(1)}
                activeOpacity={0.7}
                accessibilityLabel="Keyingi kamera"
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Footer info & pagination */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerIndex}>
              {activeIndex + 1} / {cameras.length} ta kamera
            </Text>
            <Text style={styles.footerHint}>
              Chapga / o'ngga surib kameralar orasida almashing
            </Text>
          </View>

          {currentCamera.isLive && (
            <View style={styles.footerLiveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.footerLiveText}>Jonli efir faol</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default CameraFullscreenModalNative;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width,
    aspectRatio: 16 / 9,
    backgroundColor: '#0A121A',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  liveOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timestampOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  timestampText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  navButtonLeft: {
    left: 12,
  },
  navButtonRight: {
    right: 12,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  footerIndex: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerHint: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  footerLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  footerLiveText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
  },
});
