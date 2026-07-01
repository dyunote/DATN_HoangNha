import express from 'express';
import * as wishlistController from '../controllers/wishlistController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(requireAuth);

router.get('/', wishlistController.list);
router.post('/toggle', wishlistController.toggle);
router.post('/:productId', wishlistController.add);
router.delete('/:productId', wishlistController.remove);

export default router;
