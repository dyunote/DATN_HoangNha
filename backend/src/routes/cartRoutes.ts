import express from 'express';
import * as cartController from '../controllers/cartController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.patch('/items/:itemId/select', cartController.selectItem);
router.patch('/select-all', cartController.selectAll);
router.delete('/items/:itemId', cartController.removeItem);

export default router;
