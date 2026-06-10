import express from 'express';
import * as orderController from '../controllers/orderController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(requireAuth);

router.post('/', orderController.create);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getById);

export default router;
