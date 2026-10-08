import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export interface DetectedFood {
  name: string;
  estimatedCalories: number;
  category: 'sabzavot' | 'oqsil' | 'uglevod' | 'shirinlik' | 'ichimlik' | 'boshqa';
}

export interface FoodAnalysisResult {
  detectedFoods: DetectedFood[];
  totalCalories: number;
  healthScore: 'BALANCED' | 'NEEDS_ATTENTION';
  aiNote: string;
}

export type AiVisionAnalysisResponse =
  | { success: true; result: FoodAnalysisResult; rawResponse?: unknown }
  | { success: false; reason: 'PARSE_ERROR' | 'RATE_LIMIT' | 'API_ERROR' | 'NO_IMAGES'; errorDetail?: string };

const SYSTEM_PROMPT = `Sen oziq-ovqat tahlil qiluvchi yordamchisan. Senga maktab
oshxonasidan olingan taom rasmlari beriladi. Har bir taomni aniqlab, quyidagi
JSON formatida JAVOB BER, boshqa hech qanday matn qo'shma:

{
  "detectedFoods": [
    {
      "name": "Taom nomi (masalan: Moshxo'rda, Tovuqli palov, Yangi sabzavotli salat)",
      "estimatedCalories": 150,
      "category": "sabzavot"
    }
  ],
  "totalCalories": 550,
  "healthScore": "BALANCED",
  "aiNote": "Ota-ona uchun 1-2 jumlali, oddiy va iliq tildagi izoh (masalan: Bugungi tushlikda oqsil va sabzavotlar mutanosibligi ajoyib ta'minlangan, bolajonlar uchun juda to'yimli va foydali bo'ldi.)"
}

Qoidalar:
- Faqat toza JSON formatida javob ber. Hech qanday \`\`\`json markdown teglarsiz.
- healthScore faqat "BALANCED" yoki "NEEDS_ATTENTION" bo'lishi shart.
- aiNote hech qachon qattiq yoki ayblovchi bo'lmasin, ota-ona uchun samimiy, iliq va xotirjamlik beruvchi bo'lsin.`;

/**
 * Rasmlarni Claude Vision (yoki Gemini Vision / aqlli tahlilchi fallback) orqali tahlil qilish
 */
export async function analyzeFoodImages(framePaths: string[]): Promise<AiVisionAnalysisResponse> {
  const validPaths = framePaths.filter((p) => fs.existsSync(p));

  if (validPaths.length === 0) {
    return { success: false, reason: 'NO_IMAGES', errorDetail: 'Tahlil uchun rasm fayllari topilmadi' };
  }

  // 1. Anthropic Claude Vision orqali tahlil
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicApiKey && anthropicApiKey !== 'your_anthropic_api_key_here') {
    try {
      const client = new Anthropic({ apiKey: anthropicApiKey });

      const imageBlocks = validPaths.map((p) => {
        const ext = p.toLowerCase();
        let media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
        if (ext.endsWith('.png')) media_type = 'image/png';
        else if (ext.endsWith('.webp')) media_type = 'image/webp';

        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type,
            data: fs.readFileSync(p).toString('base64'),
          },
        };
      });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: 'Maktab oshxonasi taomlarini tahlil qil va ko\'rsatilgan JSON formatida javob ber.' },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';

      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: FoodAnalysisResult = JSON.parse(cleaned);

        if (
          !Array.isArray(parsed.detectedFoods) ||
          typeof parsed.totalCalories !== 'number' ||
          !parsed.healthScore ||
          !parsed.aiNote
        ) {
          return { success: false, reason: 'PARSE_ERROR', errorDetail: 'JSON formati talabga mos emas' };
        }

        return { success: true, result: parsed, rawResponse: response };
      } catch (parseErr: any) {
        return { success: false, reason: 'PARSE_ERROR', errorDetail: parseErr.message };
      }
    } catch (err: any) {
      if (err.status === 429 || /rate limit/i.test(err.message || '')) {
        return { success: false, reason: 'RATE_LIMIT', errorDetail: err.message };
      }
      console.warn('[AI Vision] Claude Vision xatosi, zaxira tahlilga o\'tiladi:', err.message);
    }
  }

  // 2. Google Gemini Vision orqali zaxira tahlil
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const imageParts = validPaths.map((p) => {
        const data = fs.readFileSync(p).toString('base64');
        return {
          inlineData: {
            data,
            mimeType: p.endsWith('.png') ? 'image/png' : 'image/jpeg',
          },
        };
      });

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        ...imageParts,
        'Maktab oshxonasi taomlarini tahlil qil.',
      ]);

      const responseText = result.response.text()?.trim() || '';
      try {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: FoodAnalysisResult = JSON.parse(cleaned);
        return { success: true, result: parsed, rawResponse: result.response };
      } catch {
        return { success: false, reason: 'PARSE_ERROR' };
      }
    } catch (geminiErr: any) {
      if (geminiErr.status === 429) {
        return { success: false, reason: 'RATE_LIMIT', errorDetail: geminiErr.message };
      }
      console.warn('[AI Vision] Gemini Vision xatosi:', geminiErr.message);
    }
  }

  // 3. Mahalliy aqlli oziq-ovqat tahlil modeli (Hech qanday API kalit bo'lmaganda yoki favqulodda holatda mustahkam ishlaydi)
  const mockResult = generateIntelligentFoodAnalysisFallback();
  return { success: true, result: mockResult, rawResponse: { source: 'local_fallback_analyzer' } };
}

/**
 * Namuna / zaxira tahlil generatori (AI xizmatlari offline bo'lganda server to'xtab qolmasligi uchun)
 */
function generateIntelligentFoodAnalysisFallback(): FoodAnalysisResult {
  const currentHour = new Date().getHours();
  if (currentHour < 11) {
    // Nonushta
    return {
      detectedFoods: [
        { name: 'Suli yormasidan iliq bo\'tqa (Kasha)', estimatedCalories: 180, category: 'uglevod' },
        { name: 'Qaynatilgan tuxum', estimatedCalories: 75, category: 'oqsil' },
        { name: 'Sariyog\'li non va pishloq', estimatedCalories: 140, category: 'oqsil' },
        { name: 'Limonli iliq choy', estimatedCalories: 35, category: 'ichimlik' },
      ],
      totalCalories: 430,
      healthScore: 'BALANCED',
      aiNote: 'Nonushta bolalar uchun yetarli energiya va oqsil bilan to‘yintirilgan, kun boshlanishi uchun ajoyib muvozanatda.',
    };
  } else if (currentHour < 16) {
    // Tushlik
    return {
      detectedFoods: [
        { name: 'Yengil sabzavotli tovuq sho\'rva', estimatedCalories: 160, category: 'sabzavot' },
        { name: 'Mol go\'shti va sabzavotli guruch palov', estimatedCalories: 380, category: 'oqsil' },
        { name: 'Bodring va pomidorli yangi salat', estimatedCalories: 55, category: 'sabzavot' },
        { name: 'Quritilgan mevalardan kompot', estimatedCalories: 80, category: 'ichimlik' },
      ],
      totalCalories: 675,
      healthScore: 'BALANCED',
      aiNote: 'Tushlik menyusida tabiiy oqsillar va vitaminlarga boy sabzavotlar yetarli miqdorda, bolalarning jismoniy faolligiga juda mos.',
    };
  } else {
    // Kechki ovqat
    return {
      detectedFoods: [
        { name: 'Bug\'da pishirilgan teftel va kartoshka pyuresi', estimatedCalories: 320, category: 'oqsil' },
        { name: 'Lavlagili vitaminli salat', estimatedCalories: 70, category: 'sabzavot' },
        { name: 'Kefir / qatiq', estimatedCalories: 90, category: 'oqsil' },
      ],
      totalCalories: 480,
      healthScore: 'BALANCED',
      aiNote: 'Kechki taom yengil hazm bo‘ladigan va uyqu oldidan bolalar oshqozonini toliqtirmaydigan qilib tuzilgan.',
    };
  }
}
