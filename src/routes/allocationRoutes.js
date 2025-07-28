// backend/src/routes/allocationRoutes.js
const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

router.post('/run', allocationController.runAllocation);
router.get('/allocated', allocationController.getAllocatedUnits);
router.get('/unallocated', allocationController.getUnallocatedUnits);

module.exports = router;
