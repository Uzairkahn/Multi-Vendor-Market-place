const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const providerProfiles = require('../controllers/providerProfileController');
const upload = require('../middleware/upload');

router.get('/me', protect, authorizeRoles('provider'), providerProfiles.getMyProfile);
router.post('/me/photo', protect, authorizeRoles('provider'), upload.single('profilePicture'), providerProfiles.uploadProfilePicture);
router.post('/', protect, authorizeRoles('provider'), providerProfiles.upsertMyProfile);
router.put('/me', protect, authorizeRoles('provider'), providerProfiles.upsertMyProfile);
router.get('/:providerId', providerProfiles.getProviderProfile);

module.exports = router;
