import bcrypt from 'bcryptjs';
import * as userModel from '../models/userModel';
import * as cartModel from '../models/cartModel';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/response';
import { UserRow } from '../types';

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

  // Tao gio hang mac dinh cho user moi
  await cartModel.getOrCreateCart(userId);

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
