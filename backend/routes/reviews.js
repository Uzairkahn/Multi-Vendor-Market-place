const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const rev = require('../controllers/reviewController');

router.post('/', protect, rev.addReview);
router.get('/provider/:id', rev.getProviderReviews);

module.exports = router;
