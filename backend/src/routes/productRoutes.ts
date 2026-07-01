import express from 'express';
import * as productController from '../controllers/productController';
import * as reviewController from '../controllers/reviewController';
import { optionalAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', optionalAuth, productController.list);
router.get('/:id', optionalAuth, productController.getById);
router.get('/:productId/reviews', reviewController.listForProduct);

export default router;
