import { z } from 'zod';

// Dang ky: ho ten + email + mat khau bat buoc; phone/address tuy chon
export const registerSchema = z.object({
  full_name: z.string({ message: 'Vui lòng nhập họ tên' }).trim().min(1, 'Vui lòng nhập họ tên').max(150, 'Họ tên quá dài'),
  email: z.string({ message: 'Vui lòng nhập email' }).trim().toLowerCase().email('Email không hợp lệ').max(150),
  password: z.string({ message: 'Vui lòng nhập mật khẩu' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(100, 'Mật khẩu quá dài'),
  phone: z.string().trim().max(20, 'Số điện thoại quá dài').nullish(),
  address: z.string().trim().max(255, 'Địa chỉ quá dài').nullish(),
});

// Dang nhap
export const loginSchema = z.object({
  email: z.string({ message: 'Vui lòng nhập email' }).trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string({ message: 'Vui lòng nhập mật khẩu' }).min(1, 'Vui lòng nhập mật khẩu'),
});


// Quen mat khau: chi can email
export const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Vui lòng nhập email' }).trim().toLowerCase().email('Email không hợp lệ'),
});

// Dat lai mat khau: token + mat khau moi
export const resetPasswordSchema = z.object({
  token: z.string({ message: 'Thiếu token' }).min(1, 'Thiếu token đặt lại'),
  password: z.string({ message: 'Vui lòng nhập mật khẩu mới' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(100),
});
