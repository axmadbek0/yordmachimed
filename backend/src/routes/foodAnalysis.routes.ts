import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getFoodAnalyses,
  getLatestFoodAnalysis,
  getFoodAnalysisById,
  triggerFoodAnalysis,
} from '../controllers/foodAnalysis.controller';

const router = Router();

// Har bir endpoint autentifikatsiyadan o'tgan bo'lishi shart
router.use(authenticate);

router.get('/', getFoodAnalyses);
router.get('/latest', getLatestFoodAnalysis);
router.get('/:id', getFoodAnalysisById);
router.post('/trigger', triggerFoodAnalysis);

export default router;
