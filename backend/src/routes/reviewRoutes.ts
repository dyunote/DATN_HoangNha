import express from 'express';
import * as reviewController from '../controllers/reviewController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', requireAuth, reviewController.create);

export default router;
