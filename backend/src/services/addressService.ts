import * as addressModel from '../models/addressModel';
import { AppError } from '../utils/response';

interface AddressInput {
  receiver_name: string;
  phone: string;
  province: string;
  address: string;
  is_default?: boolean;
}

export const listMine = async (userId: number) => {
  return addressModel.findByUser(userId);
};

// Kiem tra dia chi ton tai va thuoc ve user dang dang nhap
const getOwned = async (userId: number, id: number) => {
  const addr = await addressModel.findById(id);
  if (!addr || addr.user_id !== userId) {
    throw new AppError('Không tìm thấy địa chỉ', 404);
  }
  return addr;
};

export const create = async (userId: number, input: AddressInput) => {
  const total = await addressModel.countByUser(userId);
  // Dia chi dau tien luon la mac dinh, tu lan sau tro di nguoi dung tu chon
  const shouldBeDefault = total === 0 || !!input.is_default;

  if (shouldBeDefault) {
    await addressModel.clearDefault(userId);
  }

  const id = await addressModel.create(userId, input, shouldBeDefault);
  return addressModel.findById(id);
};

export const update = async (userId: number, id: number, input: AddressInput) => {
  await getOwned(userId, id);
  await addressModel.update(id, input);

  if (input.is_default) {
    await addressModel.clearDefault(userId);
    await addressModel.setDefaultFlag(id, true);
  }

  return addressModel.findById(id);
};

export const setDefault = async (userId: number, id: number) => {
  await getOwned(userId, id);
  await addressModel.clearDefault(userId);
  await addressModel.setDefaultFlag(id, true);
  return addressModel.findById(id);
};

export const remove = async (userId: number, id: number) => {
  const addr = await getOwned(userId, id);
  await addressModel.remove(id);

  // Vua xoa dia chi mac dinh -> tu dong gan dia chi con lai (moi nhat) lam mac dinh
  if (addr.is_default) {
    const remaining = await addressModel.findByUser(userId);
    if (remaining.length > 0) {
      await addressModel.setDefaultFlag(remaining[0].id, true);
    }
  }
};
