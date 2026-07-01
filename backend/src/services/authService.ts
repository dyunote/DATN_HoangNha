import bcrypt from 'bcryptjs';
import * as userModel from '../models/userModel';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/response';
import { UserRow } from '../types';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../utils/mailer';

export const sanitizeUser = (user: UserRow) => {
  const { password, ...rest } = user;
  return rest;
};

interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  address?: string | null;
}

export const register = async ({ full_name, email, password, phone, address }: RegisterInput) => {
  if (!full_name || !email || !password) {
    throw new AppError('Vui long nhap day du ho ten, email va mat khau', 400);
  }
  if (password.length < 6) {
    throw new AppError('Mat khau phai co it nhat 6 ky tu', 400);
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new AppError('Email da duoc su dung', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = await userModel.create({ full_name, email, password: hashedPassword, phone, address });

  const user = await userModel.findById(userId);
  if (!user) throw new AppError('Khong tim thay nguoi dung', 404);
  const token = signToken({ id: user.id, role: user.role });

  return { user: sanitizeUser(user), token };
};

interface LoginInput {
  email: string;
  password: string;
}

export const login = async ({ email, password }: LoginInput) => {
  if (!email || !password) {
    throw new AppError('Vui long nhap email va mat khau', 400);
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new AppError('Email hoac mat khau khong dung', 401);
  }

  if (user.is_locked) {
    throw new AppError('Tai khoan cua ban da bi khoa', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email hoac mat khau khong dung', 401);
  }

  const token = signToken({ id: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
};

export const getProfile = async (userId: number) => {
  const user = await userModel.findById(userId);
  if (!user) throw new AppError('Khong tim thay nguoi dung', 404);
  return sanitizeUser(user);
};

interface UpdateProfileInput {
  full_name: string;
  phone?: string | null;
  address?: string | null;
}

export const updateProfile = async (userId: number, { full_name, phone, address }: UpdateProfileInput) => {
  if (!full_name) {
    throw new AppError('Ho ten khong duoc de trong', 400);
  }
  await userModel.updateProfile(userId, { full_name, phone, address });
  return getProfile(userId);
};

interface ChangePasswordInput {
  old_password: string;
  new_password: string;
}

export const changePassword = async (userId: number, { old_password, new_password }: ChangePasswordInput) => {
  if (!old_password || !new_password) {
    throw new AppError('Vui long nhap day du mat khau cu va moi', 400);
  }
  if (new_password.length < 6) {
    throw new AppError('Mat khau moi phai co it nhat 6 ky tu', 400);
  }

  const user = await userModel.findById(userId);
  if (!user) throw new AppError('Khong tim thay nguoi dung', 404);

  const isMatch = await bcrypt.compare(old_password, user.password);
  if (!isMatch) {
    throw new AppError('Mat khau cu khong dung', 400);
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await userModel.updatePassword(userId, hashedPassword);
};


// ----- QUEN / DAT LAI MAT KHAU -----
const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

export const forgotPassword = async (email: string) => {
  const user = await userModel.findByEmail(email);
  // Khong tiet lo email co ton tai hay khong (chong do email)
  if (user && !user.is_locked) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phut
    await userModel.setResetToken(user.id, tokenHash, expiresAt);

    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${base}/reset-password?token=${rawToken}`;
    try {
      await sendResetPasswordEmail(user.email, resetUrl);
    } catch (e) {
      // Khong chan luong neu gui mail loi; chi log de debug
      console.error('Gui mail dat lai mat khau that bai:', e);
    }
  }
  return { message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi.' };
};

export const resetPassword = async (token: string, newPassword: string) => {
  if (!token) throw new AppError('Thieu token dat lai mat khau', 400);
  if (newPassword.length < 6) throw new AppError('Mat khau moi phai co it nhat 6 ky tu', 400);

  const tokenHash = hashToken(token);
  const user = await userModel.findByResetToken(tokenHash);
  if (!user) throw new AppError('Link dat lai khong hop le hoac da het han', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userModel.updatePassword(user.id, hashedPassword);
  await userModel.clearResetToken(user.id);
};
