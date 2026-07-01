import express from 'express';
import * as voucherController from '../controllers/voucherController';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/available', optionalAuth, voucherController.available);
router.get('/mine', requireAuth, voucherController.mine);
router.post('/save', requireAuth, voucherController.save);
router.get('/:code/check', requireAuth, voucherController.check);

export default router;
