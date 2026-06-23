const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { deliveryUpload } = require('../middleware/upload');
const reqCtrl = require('../controllers/requestController');

router.post('/', protect, reqCtrl.createRequest);
router.get('/', protect, reqCtrl.getRequests);
router.put('/:id/status', protect, reqCtrl.updateRequestStatus);
router.post('/:id/deliver', protect, deliveryUpload.single('deliveryFile'), reqCtrl.deliverRequest);

module.exports = router;
