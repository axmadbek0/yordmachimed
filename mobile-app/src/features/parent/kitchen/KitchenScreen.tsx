/**
 * KitchenScreen.tsx — React Native Ota-ona kabineti Oshxona ekrani
 * 2 ustunli kamera gridi, to'liq ekranli modal va AI Taomnoma tahlili
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraTileNative } from './CameraTile.native';
import { CameraFullscreenModalNative } from './CameraFullscreenModal.native';
import { FoodAnalysisCardNative } from './FoodAnalysisCard.native';
import type {
  CameraFeedItem,
  FoodAnalysisItem,
  FoodAnalysisCardState,
} from '../../../types/foodAnalysis';

// Demo Oshxona kameralari
const KITCHEN_CAMERAS: CameraFeedItem[] = [
  {
    id: 'cam-kitchen-1',
    cameraLabel: 'Kamera #1',
    sectorLabel: 'Asosiy Oshxona va Pech',
    status: 'FAOL',
    isLive: true,
  },
  {
    id: 'cam-kitchen-2',
    cameraLabel: 'Kamera #2',
    sectorLabel: 'Taom tarqatish zali',
    status: 'FAOL',
    isLive: true,
  },
  {
    id: 'cam-kitchen-3',
    cameraLabel: 'Kamera #3',
    sectorLabel: 'Idish yuvish & Sanitariya',
    status: 'FAOL',
    isLive: true,
  },
  {
    id: 'cam-kitchen-4',
    cameraLabel: 'Kamera #4',
    sectorLabel: 'Oziq-ovqat ombori',
    status: 'FAOL',
    isLive: true,
  },
];

const MOCK_FOOD_ANALYSIS: FoodAnalysisItem = {
  id: 'mock-analysis-1',
  cameraId: 'cam-kitchen-1',
  cameraLabel: 'Asosiy Oshxona va Taom tarqatish zali',
  schoolId: 'school-71',
  schoolName: '71-sonli Ixtisoslashtirilgan Maktab-Internati',
  frameUrls: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'],
  status: 'COMPLETED',
  detectedFoods: [
    { name: 'Sabzavotli yengil mastava sho‘rva', estimatedCalories: 180, category: 'sabzavot' },
    { name: 'Tovuq go‘shtli dimlama va grechka', estimatedCalories: 360, category: 'oqsil' },
    { name: 'Yangi bodring va ko‘katli salat', estimatedCalories: 45, category: 'sabzavot' },
    { name: 'Quritilgan o‘rik va olmali kompot', estimatedCalories: 75, category: 'ichimlik' },
  ],
  totalCalories: 660,
  healthScore: 'BALANCED',
  aiNote:
    'Bugungi tushlikda oqsil va vitaminlar mutanosibligi ajoyib ta\'minlangan. Taom bolalarning darsdan keyingi faolligi uchun to\'liq energiya bag\'ishlaydi.',
  capturedAt: new Date().toISOString(),
  analyzedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export const KitchenScreen: React.FC = () => {
  const [cameras] = useState<CameraFeedItem[]>(KITCHEN_CAMERAS);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysisItem | null>(null);
  const [cardState, setCardState] = useState<FoodAnalysisCardState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // Sanitariya nazorati holati
  const hygieneStatus = {
    date: new Date().toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    result: 'A\'lo darajada (SanQ&N talablariga to\'liq mos)',
  };

  const loadFoodData = useCallback(async () => {
    setCardState('loading');
    try {
      // Simulyatsiya yoki API so'rovi
      await new Promise((res) => setTimeout(res, 600));
      setFoodAnalysis(MOCK_FOOD_ANALYSIS);
      setCardState('success');
    } catch {
      setCardState('error');
    }
  }, []);

  useEffect(() => {
    void loadFoodData();
  }, [loadFoodData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFoodData();
    setRefreshing(false);
  };

  const handleTriggerAnalyze = async () => {
    setIsTriggering(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      await loadFoodData();
    } finally {
      setIsTriggering(false);
    }
  };

  const handleNavigateModal = (delta: number) => {
    setActiveModalIndex((prev) => {
      if (prev === null || cameras.length === 0) return prev;
      return (prev + delta + cameras.length) % cameras.length;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B6FA8']}
            tintColor="#1B6FA8"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.headerTitle}>Oshxona holati</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Sun'iy intellekt orqali kunlik taomlar tahlili va sanitariya nazorati
          </Text>
        </View>

        {/* 2-Column Camera Grid */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>📹 Jonli Kameralar</Text>
            <Text style={styles.sectionCount}>{cameras.length} ta sektor</Text>
          </View>

          <View style={styles.gridContainer}>
            {cameras.map((cam, idx) => (
              <CameraTileNative
                key={cam.id}
                cameraLabel={cam.cameraLabel}
                sectorLabel={cam.sectorLabel}
                status={cam.status}
                isLive={cam.isLive}
                onPress={() => setActiveModalIndex(idx)}
              />
            ))}
          </View>
        </View>

        {/* AI Food Analysis Card (5-state) */}
        <View style={styles.section}>
          <FoodAnalysisCardNative
            analysis={foodAnalysis}
            cardState={cardState}
            onRefresh={loadFoodData}
            onTriggerAnalyze={handleTriggerAnalyze}
            isTriggering={isTriggering}
          />
        </View>

        {/* Hygiene and Safety Status */}
        <View style={styles.hygieneCard}>
          <View style={styles.hygieneIconBox}>
            <Text style={styles.hygieneIcon}>🛡️</Text>
          </View>
          <View style={styles.hygieneTextContainer}>
            <Text style={styles.hygieneTitle}>Sanitariya & Gigiyena Nazorati</Text>
            <Text style={styles.hygieneDesc}>
              So'nggi tekshiruv: <Text style={styles.boldText}>{hygieneStatus.date}</Text>
            </Text>
            <Text style={styles.hygieneResult}>
              Natija: <Text style={styles.hygieneResultHighlight}>{hygieneStatus.result}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Camera Modal */}
      <CameraFullscreenModalNative
        visible={activeModalIndex !== null}
        cameras={cameras}
        activeIndex={activeModalIndex}
        onClose={() => setActiveModalIndex(null)}
        onNavigate={handleNavigateModal}
      />
    </SafeAreaView>
  );
};

export default KitchenScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#123C5C',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123C5C',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hygieneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3E6F5',
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#123C5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 4,
  },
  hygieneIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hygieneIcon: {
    fontSize: 22,
  },
  hygieneTextContainer: {
    flex: 1,
  },
  hygieneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#123C5C',
    marginBottom: 3,
  },
  hygieneDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  boldText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  hygieneResult: {
    fontSize: 12,
    color: '#6B7280',
  },
  hygieneResultHighlight: {
    fontWeight: '700',
    color: '#059669',
  },
});
