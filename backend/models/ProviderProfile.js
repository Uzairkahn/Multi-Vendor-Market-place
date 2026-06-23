const mongoose = require('mongoose');

const ProviderProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  skills: [String],
  experience: { type: Number, default: 0 },
  pricing: { type: Number, default: 0 },
  portfolioItems: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    link: { type: String, default: '' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ProviderProfile', ProviderProfileSchema);
