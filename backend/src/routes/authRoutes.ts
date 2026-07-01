import express from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';
import { rateLimit } from '../middlewares/rateLimit';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidators';

const router = express.Router();

// Chong do mat khau: toi da 8 lan / 5 phut moi IP
const authLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 8, message: 'Ban thao tac qua nhieu lan, vui long thu lai sau vai phut' });

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireAuth, authController.getProfile);
router.put('/me', requireAuth, authController.updateProfile);
router.put('/me/password', requireAuth, authController.changePassword);

export default router;
