import { z } from 'zod';

// Them / sua dia chi giao hang
export const addressSchema = z.object({
  receiver_name: z
    .string({ message: 'Vui lòng nhập họ tên người nhận' })
    .trim()
    .min(1, 'Vui lòng nhập họ tên người nhận')
    .max(150, 'Họ tên quá dài'),
  phone: z
    .string({ message: 'Vui lòng nhập số điện thoại' })
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .max(20, 'Số điện thoại quá dài'),
  province: z
    .string({ message: 'Vui lòng chọn tỉnh/thành' })
    .trim()
    .min(1, 'Vui lòng chọn tỉnh/thành')
    .max(100, 'Tên tỉnh/thành quá dài'),
  address: z
    .string({ message: 'Vui lòng nhập địa chỉ chi tiết' })
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ chi tiết')
    .max(255, 'Địa chỉ quá dài'),
  is_default: z.boolean().optional(),
});
