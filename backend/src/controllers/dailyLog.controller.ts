import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { asyncHandler } from '../utils/asyncHandler';
import { createDailyLogWithAi } from '../services/dailyLog.service';
import { CreateDailyLogInput } from '../validations/dailyLog.validation';

export const createDailyLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input = req.body as CreateDailyLogInput;
  const log = await createDailyLogWithAi(req.user, input);

  res.status(201).json({
    message: log.ai_analysis
      ? 'Kunlik hisobot va AI tahlili saqlandi'
      : 'Kunlik hisobot saqlandi (AI tahlili vaqtincha mavjud emas)',
    log,
    aiGenerated: Boolean(log.ai_analysis),
  });
});
