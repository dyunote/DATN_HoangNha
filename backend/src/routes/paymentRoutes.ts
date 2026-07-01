import express from 'express';
import * as paymentController from '../controllers/paymentController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// Webhook SePay - public (xac thuc bang API Key trong controller), khong qua requireAuth
router.post('/sepay/webhook', paymentController.sepayWebhook);

router.get('/:orderId', requireAuth, paymentController.getByOrder);

export default router;
