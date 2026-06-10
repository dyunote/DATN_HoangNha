import express from 'express';
import * as paymentController from '../controllers/paymentController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/:orderId', requireAuth, paymentController.getByOrder);

export default router;
