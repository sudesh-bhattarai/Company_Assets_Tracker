const express = require('express');
const controller = require('../controllers/assignmentController');

const router = express.Router();

router.get('/', controller.getAssignments);
router.post('/', controller.assignAsset);
router.put('/:id/return', controller.returnAsset);

module.exports = router;
