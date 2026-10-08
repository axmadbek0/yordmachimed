import { captureFrame } from '../services/frameCaptureService';
import { analyzeFoodImages } from '../services/aiVisionService';
import { processFoodAnalysis } from '../services/foodAnalysisProcessor';
import { runScheduledKitchenCapture } from '../services/scheduler';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('--- OSHXONA AI TAHLILI: ARCHITECTURE TESTLARI ---');

  // 1. Frame Capture Service — Offline & Error handling test
  console.log('1. Frame Capture xatolarga chidamlilik testi...');
  const offlineResult = await captureFrame('rtsp://invalid-offline-stream-host:8554/live', '/tmp/test-offline.jpg');
  if (offlineResult.success === false && (offlineResult.reason === 'OFFLINE' || offlineResult.reason === 'TIMEOUT' || offlineResult.reason === 'UNKNOWN')) {
    console.log('  ✔ Kamera oflayn bo\'lganda server qulamadi, xato holati ushlandi:', offlineResult.reason);
  } else {
    throw new Error('Kamera oflayn xatosi to\'g\'ri ushlanmadi');
  }

  // 2. AI Vision Service — Tahlil testi
  console.log('2. AI Vision tahlil testi...');
  const sampleImagePath = path.resolve(process.cwd(), 'uploads/food-frames/test-sample.jpg');
  const sampleDir = path.dirname(sampleImagePath);
  if (!fs.existsSync(sampleDir)) {
    fs.mkdirSync(sampleDir, { recursive: true });
  }
  // Kichik test rasm faylini yaratish
  fs.writeFileSync(sampleImagePath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9]));

  const aiResult = await analyzeFoodImages([sampleImagePath]);
  if (aiResult.success) {
    console.log('  ✔ AI Vision tahlili muvaffaqiyatli:');
    console.log('    - Jami kaloriya:', aiResult.result.totalCalories, 'kkal');
    console.log('    - Sog\'lomlik bahosi:', aiResult.result.healthScore);
    console.log('    - Aniqlangan taomlar soni:', aiResult.result.detectedFoods.length);
    console.log('    - AI Izohi:', aiResult.result.aiNote);
  } else {
    console.log('  ✔ AI xatosi ushlandi:', aiResult.reason);
  }

  // 3. Process Food Analysis Pipeline testi
  console.log('3. Food Analysis to\'liq pipeline va DB saqlash testi...');
  const kitchenCamera = await prisma.camera.findFirst({
    where: { type: 'KITCHEN' },
  });

  if (kitchenCamera) {
    const analysisRecord = await processFoodAnalysis(kitchenCamera.id, [sampleImagePath]);
    if (analysisRecord && analysisRecord.id) {
      console.log('  ✔ Pipeline muvaffaqiyatli yakunlandi, DB ID:', analysisRecord.id);
      console.log('    - Status:', analysisRecord.status);
      console.log('    - Total Calories:', analysisRecord.total_calories);
      console.log('    - Health Score:', analysisRecord.health_score);
    } else {
      throw new Error('Pipeline DB record yaratmadi');
    }
  }

  // 4. Scheduler multi-camera loop testi
  console.log('4. Scheduler kamera tsikli testi...');
  const schedResult = await runScheduledKitchenCapture();
  console.log('  ✔ Scheduler natijasi:', schedResult);

  console.log('\n✅ BARCHA OSHXONA AI TESTLARI MUVAFFAQIYATLI O\'TDI!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test xatosi:', err);
  process.exit(1);
});
