import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';
import { registerStore, getMyStore, updateMyStore, getMyComplaints, resolveMyComplaint } from '../controllers/pharmacy.controller.ts';
import { validate, updateStoreSchema } from '../middleware/validate.middleware.ts';

const router = Router();

router.post('/',              authenticate, requireRole('pharmacy_owner'), registerStore);
router.get('/me',             authenticate, getMyStore);
router.patch('/me',           authenticate, requireRole('pharmacy_owner'), validate(updateStoreSchema), updateMyStore);
router.get('/complaints',     authenticate, requireRole('pharmacy_owner'), getMyComplaints);
router.patch('/complaints/:id/resolve', authenticate, requireRole('pharmacy_owner'), resolveMyComplaint);

export default router;
