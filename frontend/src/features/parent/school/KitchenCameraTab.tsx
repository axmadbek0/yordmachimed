/**
 * KitchenCameraTab — Oshxona holati, jonli kameralar va AI Taomnoma tahlili
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck, Video } from 'lucide-react';
import { CameraGrid, type CameraFeedItem } from '@/components/camera/CameraGrid';
import { FoodAnalysisCard } from '@/components/camera/FoodAnalysisCard';
import { getKitchenCameras } from '@/lib/kitchenApi';
import { getLatestFoodAnalysis, triggerManualFoodAnalysis } from '@/lib/foodAnalysisApi';
import type { FoodAnalysisItem, FoodAnalysisCardState } from '@/types/foodAnalysis';

interface KitchenCameraTabProps {
  schoolId: string;
}

export function KitchenCameraTab({ schoolId }: KitchenCameraTabProps) {
  const [cameras, setCameras] = useState<CameraFeedItem[]>([]);
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysisItem | null>(null);
  const [foodCardState, setFoodCardState] = useState<FoodAnalysisCardState>('loading');
  const [isTriggering, setIsTriggering] = useState(false);

  const [hygiene, setHygiene] = useState<{
    date: string;
    result: string;
  } | null>(null);

  // Kameralar va sanitariya holatini yuklash
  const loadKitchenCameras = useCallback(async () => {
    try {
      const data = await getKitchenCameras(schoolId);
      if (!data.isEnabled) {
        setCameras([]);
        setHygiene(null);
      } else {
        setCameras(data.cameras || []);
        setHygiene(data.lastHygieneCheck ?? null);
      }
    } catch {
      setCameras([]);
      setHygiene(null);
    }
  }, [schoolId]);

  // AI Taomnoma tahlilini yuklash
  const loadFoodAnalysis = useCallback(async () => {
    setFoodCardState('loading');
    try {
      const res = await getLatestFoodAnalysis(schoolId);

      if (!res.analysis) {
        if (res.cameraStatus === 'CAMERA_OFFLINE') {
          setFoodCardState('partial');
        } else {
          setFoodCardState('empty');
        }
        setFoodAnalysis(null);
        return;
      }

      setFoodAnalysis(res.analysis);
      if (res.analysis.status === 'COMPLETED') {
        setFoodCardState('success');
      } else if (res.analysis.status === 'FAILED') {
        setFoodCardState('error');
      } else {
        setFoodCardState('loading');
      }
    } catch {
      setFoodCardState('error');
    }
  }, [schoolId]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadKitchenCameras(), loadFoodAnalysis()]);
  }, [loadKitchenCameras, loadFoodAnalysis]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Test / Trigger tahlil
  const handleTriggerAnalyze = async () => {
    setIsTriggering(true);
    try {
      await triggerManualFoodAnalysis();
      setTimeout(async () => {
        await loadFoodAnalysis();
        setIsTriggering(false);
      }, 1500);
    } catch {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Sarlavha va yangilash tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold text-deep font-serif">
              Oshxona holati
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Jonli videokuzatuv, sun'iy intellekt orqali kunlik taomlar tahlili va sanitariya nazorati
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary hover:text-white min-h-[44px] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Hammasini yangilash
        </button>
      </div>

      {/* 2. JONLI KAMERALAR GRIDI (Mobilda 1 ustun, desktopda 2 ustun) */}
      {cameras.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-deep flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" /> Oshxona Kameralari
            </h3>
            <span className="text-xs text-muted font-medium">
              {cameras.length} ta sektor
            </span>
          </div>
          <CameraGrid cameras={cameras} />
        </section>
      )}

      {/* 3. AI OSHXONA TAHLILI KARTASI (5-holat) */}
      <section className="space-y-3">
        <FoodAnalysisCard
          analysis={foodAnalysis}
          cardState={foodCardState}
          onRefresh={() => void loadFoodAnalysis()}
          onTriggerAnalyze={handleTriggerAnalyze}
          isTriggering={isTriggering}
        />
      </section>

      {/* 4. SANITARIYA HOLATI */}
      {hygiene && (
        <div className="bg-white rounded-2xl border border-cardBlue p-4 sm:p-5 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-deep">Sanitariya va Gigiyena Nazorati</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              So‘nggi sanitariya tekshiruvi:{' '}
              <span className="font-semibold text-deep">
                {new Date(hygiene.date).toLocaleDateString('uz-UZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              {' — '}
              Natija:{' '}
              <span className="font-semibold text-emerald-700 capitalize">{hygiene.result}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
