import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

// @ffmpeg-installer/ffmpeg dan yo'lni aniqlash
let ffmpegPath = 'ffmpeg';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpegPath = ffmpegInstaller.path;
  }
} catch {
  // Tizimdagi standart 'ffmpeg' ishlatiladi
}

export type FrameCaptureResult =
  | { success: true; path: string }
  | { success: false; reason: 'OFFLINE' | 'TIMEOUT' | 'UNKNOWN'; errorDetail?: string };

/**
 * RTSP yoki video oqimidan bitta kadr olib saqlash (ffmpeg, xatolarga chidamli)
 * Timeout: 15000ms — kamera javob bermasa, server osilib qolmaydi
 */
export async function captureFrame(
  streamUrl: string,
  outputPath: string
): Promise<FrameCaptureResult> {
  try {
    if (!streamUrl || typeof streamUrl !== 'string' || !streamUrl.trim()) {
      return { success: false, reason: 'OFFLINE', errorDetail: 'Stream URL mavjud emas' };
    }

    const trimmedUrl = streamUrl.trim();

    // Chiqish papkasi mavjudligini ta'minlash
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Agar URL test rasm URL bo'lsa (http/https rasm), to'g'ridan-to'g'ri yuklab olish yoki ffmpeg orqali olish
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      // HTTP(S) video yoki rasm oqimi
      try {
        await execFileAsync(
          ffmpegPath,
          [
            '-y',
            '-i',
            trimmedUrl,
            '-vframes',
            '1',
            '-q:v',
            '2',
            outputPath,
          ],
          { timeout: 15000 }
        );

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return { success: true, path: outputPath };
        }
      } catch (httpFfmpegErr: any) {
        // Agar ffmpeg http uchun xato bersa, fetch bilan rasm yuklashga harakat qilamiz
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          const response = await fetch(trimmedUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            return { success: false, reason: 'OFFLINE', errorDetail: `HTTP Status: ${response.status}` };
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(outputPath, buffer);
          return { success: true, path: outputPath };
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            return { success: false, reason: 'TIMEOUT' };
          }
          return { success: false, reason: 'OFFLINE', errorDetail: fetchErr.message };
        }
      }
    }

    // Standart RTSP / video oqimi
    await execFileAsync(
      ffmpegPath,
      [
        '-y',
        '-rtsp_transport',
        'tcp',
        '-i',
        trimmedUrl,
        '-vframes',
        '1',
        '-q:v',
        '2',
        outputPath,
      ],
      { timeout: 15000 }
    );

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return { success: true, path: outputPath };
    }

    return { success: false, reason: 'OFFLINE', errorDetail: 'Fayl yaratilmadi' };
  } catch (err: any) {
    if (err.killed || err.signal === 'SIGTERM' || /timeout/i.test(err.message || '')) {
      return { success: false, reason: 'TIMEOUT' };
    }

    const message = err.message || '';
    if (
      err.code === 'ENOENT' ||
      /Connection refused|No route|Server returned 404|Server returned 403|Immediate exit requested|Connection timed out|Network is unreachable/i.test(
        message
      )
    ) {
      return { success: false, reason: 'OFFLINE', errorDetail: message };
    }

    return { success: false, reason: 'UNKNOWN', errorDetail: message };
  }
}
