import type { FoodAnalysisItem } from '../types/foodAnalysis';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem('yordamchi_auth_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('yordamchi_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Maktabning eng so'nggi oshxona AI tahlilini olish
 */
export async function getLatestFoodAnalysis(
  _schoolId?: string
): Promise<{
  analysis: FoodAnalysisItem | null;
  cameraStatus?: string;
  isOfflineFallback?: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE}/food-analysis/latest`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        return { analysis: null };
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    return {
      analysis: json.data || null,
      cameraStatus: json.cameraStatus,
      isOfflineFallback: false,
    };
  } catch (error) {
    console.warn('[foodAnalysisApi] Backend so\'rovida xatolik, zaxira tahlil ko\'rsatiladi:', error);
    // Offline / Demo fallback
    return {
      analysis: getMockFoodAnalysis(),
      cameraStatus: 'SUCCESS',
      isOfflineFallback: true,
    };
  }
}

/**
 * Maktabning barcha tahlillar tarixini olish
 */
export async function getFoodAnalysesList(
  _schoolId?: string,
  limit = 10
): Promise<FoodAnalysisItem[]> {
  try {
    const response = await fetch(`${API_BASE}/food-analysis?limit=${limit}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    return json.data || [];
  } catch {
    const mock = getMockFoodAnalysis();
    return mock ? [mock] : [];
  }
}

/**
 * Qo'lda tahlilni sinab ko'rish / ishga tushirish (Test trigger)
 */
export async function triggerManualFoodAnalysis(cameraId?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/food-analysis/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cameraId }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

function getMockFoodAnalysis(): FoodAnalysisItem {
  return {
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
    aiNote: 'Bugungi tushlikda oqsil va vitaminlar mutanosibligi ajoyib ta\'minlangan. Taom bolalarning darsdan keyingi faolligi uchun to\'liq energiya bag\'ishlaydi.',
    capturedAt: new Date().toISOString(),
    analyzedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
