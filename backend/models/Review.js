const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedback: String
}, { timestamps: true });

ReviewSchema.index({ providerId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
