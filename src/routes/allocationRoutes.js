// backend/src/routes/allocationRoutes.js
import { Router } from 'express';
const router = Router();
import { runAllocation, getAllocatedUnits, getUnallocatedUnits } from '../controllers/allocationController';

router.post('/run', runAllocation);
router.get('/allocated', getAllocatedUnits);
router.get('/unallocated', getUnallocatedUnits);

export default router;
