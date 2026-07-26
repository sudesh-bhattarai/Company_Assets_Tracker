const express = require('express');
const controller = require('../controllers/maintenanceController');

const router = express.Router();

router.get('/', controller.getMaintenanceRecords);
router.post('/', controller.createMaintenanceRecord);
router.put('/:id', controller.updateMaintenanceRecord);

module.exports = router;
