const Review = require('../models/Review');
const User = require('../models/User');

exports.addReview = async (req, res, next) => {
  try {
    const { providerId, rating, feedback } = req.body;
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can leave reviews' });
    }
    const parsedRating = Number(rating);
    if (!providerId) return res.status(400).json({ message: 'Provider ID is required' });
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }
    const provider = await User.findOne({ _id: providerId, role: 'provider' });
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    const existingReview = await Review.findOne({ providerId, customerId: req.user.id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this provider' });
    }
    const review = await Review.create({
      providerId,
      customerId: req.user.id,
      rating: parsedRating,
      feedback: String(feedback || '').trim()
    });
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this provider' });
    }
    next(err);
  }
};

exports.getProviderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ providerId: req.params.id }).populate('customerId','name');
    const avg = reviews.length ? (reviews.reduce((s,r) => s + r.rating,0) / reviews.length).toFixed(2) : 0;
    res.json({ reviews, averageRating: Number(avg) });
  } catch (err) { next(err); }
};
