const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const svc = require('../controllers/serviceController');

router.post('/', protect, authorizeRoles('provider','admin'), svc.createService);
router.get('/', svc.getServices);
router.get('/:id', svc.getServiceById);
router.put('/:id', protect, svc.updateService);
router.delete('/:id', protect, svc.deleteService);

module.exports = router;
