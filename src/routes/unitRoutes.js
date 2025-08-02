// backend/src/routes/unitRoutes.js
import { Router } from 'express';
const router = Router();
import { submitUnits, getUnits } from '../controllers/unitController';

router.post('/', submitUnits);
router.get('/', getUnits);

export default router;
