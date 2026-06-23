const ProviderProfile = require('../models/ProviderProfile');
const { uploadImageBuffer } = require('../config/cloudinary');

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) return skills.map((skill) => String(skill).trim()).filter(Boolean);
  if (typeof skills === 'string') return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  return [];
};

const normalizePortfolioItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      title: String(item.title || '').trim(),
      description: String(item.description || '').trim(),
      link: String(item.link || '').trim()
    }))
    .filter((item) => item.title);
};

const buildProfilePayload = (body) => {
  const pricing = Number(body.pricing);
  const experience = Number(body.experience);
  return {
    bio: String(body.bio || '').trim(),
    profilePicture: String(body.profilePicture || '').trim(),
    skills: normalizeSkills(body.skills),
    experience: Number.isNaN(experience) || experience < 0 ? 0 : experience,
    pricing: Number.isNaN(pricing) || pricing < 0 ? 0 : pricing,
    portfolioItems: normalizePortfolioItems(body.portfolioItems)
  };
};

exports.upsertMyProfile = async (req, res, next) => {
  try {
    const payload = buildProfilePayload(req.body);
    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email role');
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user.id }).populate('userId', 'name email role');
    if (!profile) return res.status(404).json({ message: 'Provider profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

exports.getProviderProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.params.providerId }).populate('userId', 'name email role');
    if (!profile) return res.status(404).json({ message: 'Provider profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an image file' });
    const profilePicture = await uploadImageBuffer(req.file);
    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { profilePicture } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email role');
    res.json({ profilePicture, profile });
  } catch (err) {
    next(err);
  }
};
