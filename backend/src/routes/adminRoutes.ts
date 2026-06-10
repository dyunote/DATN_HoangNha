import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';

import * as productController from '../controllers/productController';
import * as categoryController from '../controllers/categoryController';
import * as orderController from '../controllers/orderController';
import * as adminUserController from '../controllers/adminUserController';
import * as adminStatisticsController from '../controllers/adminStatisticsController';
import * as voucherController from '../controllers/voucherController';
import * as paymentController from '../controllers/paymentController';

const router = express.Router();

// Tat ca route admin deu yeu cau dang nhap va co quyen admin
router.use(requireAuth, requireAdmin);

// Quan ly san pham
router.get('/products', productController.adminList);
router.get('/products/:id', productController.adminGetById);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.patch('/products/:id/hidden', productController.setHidden);
router.delete('/products/:id', productController.remove);

// Quan ly danh muc
router.get('/categories', categoryController.adminList);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.patch('/categories/:id/hidden', categoryController.setHidden);

// Quan ly don hang
router.get('/orders', orderController.adminList);
router.get('/orders/:id', orderController.getById);
router.patch('/orders/:id/status', orderController.adminUpdateStatus);

// Quan ly thanh toan
router.patch('/payments/:orderId/status', paymentController.updateStatus);

// Quan ly nguoi dung
router.get('/users', adminUserController.list);
router.patch('/users/:id/lock', adminUserController.setLocked);

// Quan ly voucher
router.get('/vouchers', voucherController.adminList);
router.post('/vouchers', voucherController.create);
router.put('/vouchers/:id', voucherController.update);

// Thong ke
router.get('/statistics', adminStatisticsController.getDashboard);

export default router;
