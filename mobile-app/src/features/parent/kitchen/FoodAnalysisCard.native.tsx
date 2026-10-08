/**
 * FoodAnalysisCard.native.tsx — React Native AI Ovqat Tahlili Kartasi
 * 5 ta holat: loading | empty | error | partial | success
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type {
  FoodAnalysisItem,
  FoodAnalysisCardState,
  DetectedFood,
} from '../../../types/foodAnalysis';

interface FoodAnalysisCardNativeProps {
  analysis: FoodAnalysisItem | null;
  cardState: FoodAnalysisCardState;
  onRefresh?: () => void;
  onTriggerAnalyze?: () => void;
  isTriggering?: boolean;
}

function getCategoryIcon(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('sabzavot') || cat.includes('meva')) return '🥗';
  if (cat.includes('oqsil') || cat.includes('go\'sht') || cat.includes('tuxum')) return '🍗';
  if (cat.includes('uglevod') || cat.includes('don') || cat.includes('non')) return '🌾';
  if (cat.includes('ichimlik') || cat.includes('choy') || cat.includes('kompot')) return '🍵';
  return '🍽️';
}

function getHealthScoreLabel(score?: string): { label: string; color: string; bg: string } {
  switch (score) {
    case 'BALANCED':
      return { label: 'Mutanosib taomnoma', color: '#047857', bg: '#ECFDF5' };
    case 'MODERATE':
      return { label: "O'rtacha me'yorda", color: '#B45309', bg: '#FFFBEB' };
    case 'NEEDS_ATTENTION':
      return { label: "E'tibor talab", color: '#B91C1C', bg: '#FEF2F2' };
    default:
      return { label: 'Salomatlikka mos', color: '#047857', bg: '#ECFDF5' };
  }
}

export const FoodAnalysisCardNative: React.FC<FoodAnalysisCardNativeProps> = ({
  analysis,
  cardState,
  onRefresh,
  onTriggerAnalyze,
  isTriggering = false,
}) => {
  const [imageExpanded, setImageExpanded] = useState(false);

  // 1. LOADING STATE (Skeleton)
  if (cardState === 'loading') {
    return (
      <View style={styles.card}>
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color="#1B6FA8" />
          <Text style={styles.loadingHeaderText}>
            AI taomnoma tahlili yuklanmoqda...
          </Text>
        </View>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLineFull} />
        <View style={styles.skeletonLineFull} />
      </View>
    );
  }

  // 2. EMPTY STATE
  if (cardState === 'empty') {
    return (
      <View style={styles.card}>
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>🍲</Text>
          </View>
          <Text style={styles.emptyTitle}>
            Bugun hali taomnoma tahlili kelmadi
          </Text>
          <Text style={styles.emptyDescription}>
            Maktab oshxonasida taom tayyorlangach, sun'iy intellekt kadrni tahlil qilib,
            bu yerda to'liq ozuqaviy qiymati va iliq izohni ko'rsatadi.
          </Text>

          <View style={styles.actionRow}>
            {onRefresh && (
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineButtonText}>🔄 Yangilash</Text>
              </TouchableOpacity>
            )}

            {onTriggerAnalyze && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onTriggerAnalyze}
                disabled={isTriggering}
                activeOpacity={0.7}
              >
                {isTriggering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    ✨ Test tahlilni boshlash
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 3. ERROR STATE
  if (cardState === 'error') {
    return (
      <View style={[styles.card, styles.errorCardBorder]}>
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorIconText}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Tahlilni yuklashda xatolik</Text>
          <Text style={styles.errorDescription}>
            Server bilan bog'lanishda muammo yuz berdi. Internetni tekshirib, qayta urinib ko'ring.
          </Text>

          {onRefresh && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>🔄 Qayta urinish</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // 4. PARTIAL STATE (Camera offline)
  if (cardState === 'partial' || !analysis) {
    return (
      <View style={styles.card}>
        <View style={styles.partialBanner}>
          <Text style={styles.partialIcon}>📡</Text>
          <View style={styles.partialTextContainer}>
            <Text style={styles.partialTitle}>
              Oshxona kamerasi vaqtincha oflayn
            </Text>
            <Text style={styles.partialDesc}>
              Kamera tarmog'i tiklangach, AI tahlil avtomatik yangilanadi.
            </Text>
          </View>
        </View>
        {onRefresh && (
          <TouchableOpacity
            style={[styles.outlineButton, { marginTop: 12 }]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineButtonText}>🔄 Qayta tekshirish</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 5. SUCCESS STATE
  const healthMeta = getHealthScoreLabel(analysis.healthScore);
  const mainImage = analysis.frameUrls?.[0];

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✨ AI TAOMNOMA TAHLILI</Text>
          </View>
          <View
            style={[
              styles.healthBadge,
              { backgroundColor: healthMeta.bg, borderColor: healthMeta.color + '40' },
            ]}
          >
            <Text style={[styles.healthBadgeText, { color: healthMeta.color }]}>
              {healthMeta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.schoolNameText}>
          {analysis.schoolName || analysis.cameraLabel}
        </Text>
      </View>

      {/* Snapshot Photo */}
      {mainImage ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setImageExpanded(!imageExpanded)}
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: mainImage }}
            style={imageExpanded ? styles.imageExpanded : styles.imagePreview}
            resizeMode="cover"
          />
          <View style={styles.imageOverlayTag}>
            <Text style={styles.imageOverlayTagText}>
              📷 Oshxona kadridan tahlil qilingan
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Detected Foods */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Aniqlangan taomlar</Text>
          <View style={styles.caloriePill}>
            <Text style={styles.caloriePillText}>
              🔥 Jami: {analysis.totalCalories} kkal
            </Text>
          </View>
        </View>

        <View style={styles.foodList}>
          {analysis.detectedFoods?.map((food: DetectedFood, idx: number) => (
            <View key={idx} style={styles.foodItemRow}>
              <View style={styles.foodItemLeft}>
                <Text style={styles.foodItemIcon}>
                  {getCategoryIcon(food.category)}
                </Text>
                <Text style={styles.foodItemName}>{food.name}</Text>
              </View>
              <Text style={styles.foodItemCalories}>
                ~{food.estimatedCalories} kkal
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI Warm Note */}
      {analysis.aiNote ? (
        <View style={styles.aiNoteBox}>
          <View style={styles.aiNoteHeader}>
            <Text style={styles.aiNoteSparkle}>💡</Text>
            <Text style={styles.aiNoteTitle}>Oziqlanish va Energiya Izohi</Text>
          </View>
          <Text style={styles.aiNoteBody}>{analysis.aiNote}</Text>
        </View>
      ) : null}

      {/* Card Actions */}
      <View style={styles.footerActionRow}>
        {onRefresh && (
          <TouchableOpacity
            style={styles.footerSmallButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.footerSmallButtonText}>🔄 Yangilash</Text>
          </TouchableOpacity>
        )}

        {onTriggerAnalyze && (
          <TouchableOpacity
            style={styles.footerSmallPrimaryButton}
            onPress={onTriggerAnalyze}
            disabled={isTriggering}
            activeOpacity={0.7}
          >
            {isTriggering ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.footerSmallPrimaryButtonText}>
                ⚡ Qayta tahlil
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FoodAnalysisCardNative;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3E6F5',
    shadowColor: '#123C5C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  errorCardBorder: {
    borderColor: '#FCA5A5',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingHeaderText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#123C5C',
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#EBF4FB',
    borderRadius: 16,
    marginBottom: 12,
  },
  skeletonLineShort: {
    width: '40%',
    height: 16,
    backgroundColor: '#EBF4FB',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineFull: {
    width: '100%',
    height: 12,
    backgroundColor: '#EBF4FB',
    borderRadius: 6,
    marginBottom: 6,
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF3FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123C5C',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  outlineButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B6FA8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#1B6FA8',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1B6FA8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorIconText: {
    fontSize: 26,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  partialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
  },
  partialIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  partialTextContainer: {
    flex: 1,
  },
  partialTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  partialDesc: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  aiBadge: {
    backgroundColor: '#1B6FA8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  schoolNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123C5C',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D3E6F5',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  imageExpanded: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  imageOverlayTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imageOverlayTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#123C5C',
  },
  caloriePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  caloriePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  foodList: {
    gap: 6,
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  foodItemIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  foodItemName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  foodItemCalories: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  aiNoteBox: {
    backgroundColor: '#EAF3FB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  aiNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiNoteSparkle: {
    fontSize: 14,
    marginRight: 6,
  },
  aiNoteTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiNoteBody: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  footerActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  footerSmallButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSmallButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  footerSmallPrimaryButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1B6FA8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSmallPrimaryButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
