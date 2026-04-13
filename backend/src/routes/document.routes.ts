import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.ts';
import { uploadSingle } from '../middleware/upload.middleware.ts';
import { uploadDocument, getDocumentUrl, listDocuments } from '../controllers/document.controller.ts';

const router = Router();

router.post('/', authenticate, requireRole('pharmacy_owner'), (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, uploadDocument);

router.get('/',        authenticate, requireRole('pharmacy_owner'), listDocuments);
router.get('/:id/url', authenticate, getDocumentUrl);

export default router;
