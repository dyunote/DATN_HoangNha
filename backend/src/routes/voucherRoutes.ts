import express from 'express';
import * as voucherController from '../controllers/voucherController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/:code/check', requireAuth, voucherController.check);

export default router;
