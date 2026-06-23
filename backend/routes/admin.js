const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const admin = require('../controllers/adminController');

router.get('/stats', protect, authorizeRoles('admin'), admin.getStats);

module.exports = router;
