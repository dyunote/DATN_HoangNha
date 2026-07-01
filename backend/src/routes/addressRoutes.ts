import express from 'express';
import * as addressController from '../controllers/addressController';
import { requireAuth } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { addressSchema } from '../validators/addressValidators';

const router = express.Router();

// Tat ca route so dia chi deu yeu cau dang nhap
router.use(requireAuth);

router.get('/', addressController.list);
router.post('/', validate(addressSchema), addressController.create);
router.put('/:id', validate(addressSchema), addressController.update);
router.patch('/:id/default', addressController.setDefault);
router.delete('/:id', addressController.remove);

export default router;
