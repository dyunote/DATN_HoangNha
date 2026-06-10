import express from 'express';
import * as productController from '../controllers/productController';
import * as reviewController from '../controllers/reviewController';

const router = express.Router();

router.get('/', productController.list);
router.get('/:id', productController.getById);
router.get('/:productId/reviews', reviewController.listForProduct);

export default router;
