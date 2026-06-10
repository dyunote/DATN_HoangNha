import express from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getProfile);
router.put('/me', requireAuth, authController.updateProfile);
router.put('/me/password', requireAuth, authController.changePassword);

export default router;
