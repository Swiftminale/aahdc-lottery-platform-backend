// backend/src/routes/unitRoutes.js
import { Router } from 'express';
const router = Router();
// import { submitUnits, getUnits } from '../controllers/unitController';
import { submitUnits, getUnits } from "../controllers/unitController.js";

router.post('/', submitUnits);
router.get('/', getUnits);

export default router;
