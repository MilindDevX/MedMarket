import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';
import { getPharmacyInsights } from '../controllers/ai.controller.ts';

const router = Router();

// GET /api/v1/ai/pharmacy/ai-insights — Pharmacy owner gets AI business insights
router.get('/pharmacy/ai-insights', authenticate, requireRole('pharmacy_owner'), getPharmacyInsights);

export default router;
