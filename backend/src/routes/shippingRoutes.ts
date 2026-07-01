import express from 'express';
import * as shippingController from '../controllers/shippingController';

const router = express.Router();

// Public - phuc vu trang gio hang / thanh toan uoc tinh phi ship
router.get('/provinces', shippingController.listProvinces);
router.post('/quote', shippingController.quote);

export default router;
