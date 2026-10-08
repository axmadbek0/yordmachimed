export type FoodAnalysisCardState = 'loading' | 'empty' | 'error' | 'success' | 'partial';

export interface DetectedFood {
  name: string;
  estimatedCalories: number;
  category?: 'sabzavot' | 'oqsil' | 'uglevod' | 'ichimlik' | string;
}

export interface FoodAnalysisItem {
  id: string;
  cameraId: string;
  cameraLabel: string;
  schoolId: string;
  schoolName?: string;
  frameUrls: string[];
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  detectedFoods: DetectedFood[];
  totalCalories: number;
  healthScore?: 'BALANCED' | 'MODERATE' | 'NEEDS_ATTENTION' | string;
  aiNote: string;
  capturedAt: string;
  analyzedAt?: string;
  createdAt: string;
}

export interface CameraFeedItem {
  id: string;
  cameraLabel: string;
  sectorLabel: string;
  status: 'FAOL' | 'FAOL EMAS';
  isLive: boolean;
  thumbnailUrl?: string;
  streamUrl?: string;
}
