const express = require('express');
const controller = require('../controllers/assetController');

const router = express.Router();

router.get('/', controller.getAssets);
router.get('/:id', controller.getAssetById);
router.post('/', controller.createAsset);
router.put('/:id', controller.updateAsset);
router.delete('/:id', controller.deleteAsset);

module.exports = router;
