const mongoose = require('mongoose');
const Service = require('../models/Service');
const Review = require('../models/Review');

const attachProviderReviewStats = async (services) => {
  const docs = Array.isArray(services) ? services : [services];
  const providerIds = [...new Set(docs.map((service) => {
    const provider = service.providerId;
    return provider?._id?.toString?.() || provider?.toString?.();
  }).filter(Boolean))];
  const stats = await Review.aggregate([
    { $match: { providerId: { $in: providerIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$providerId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
  ]);
  const statsByProvider = stats.reduce((map, item) => {
    map[item._id.toString()] = {
      averageRating: Number(item.averageRating.toFixed(2)),
      reviewCount: item.reviewCount
    };
    return map;
  }, {});
  const enriched = docs.map((service) => {
    const obj = service.toObject ? service.toObject() : service;
    const providerId = obj.providerId?._id?.toString?.() || obj.providerId?.toString?.();
    const providerStats = statsByProvider[providerId] || { averageRating: 0, reviewCount: 0 };
    const provider = obj.providerId && typeof obj.providerId === 'object'
      ? { id: providerId, name: obj.providerId.name || 'Unknown provider', email: obj.providerId.email || '' }
      : { id: providerId, name: 'Unknown provider', email: '' };
    return { ...obj, provider, providerStats };
  });
  return Array.isArray(services) ? enriched : enriched[0];
};

exports.createService = async (req, res, next) => {
  try {
    const { title, description, category, price, deliveryTime } = req.body;
    if (!title?.trim() || !category?.trim() || price === undefined || price === null) {
      return res.status(400).json({ message: 'Title, category, and price are required' });
    }
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Please provide a valid price' });
    }
    const service = await Service.create({
      title: title.trim(),
      description: description?.trim() || '',
      category: category.trim(),
      price: parsedPrice,
      deliveryTime: deliveryTime?.trim() || 'Standard',
      providerId: req.user.id
    });
    res.status(201).json(service);
  } catch (err) { next(err); }
};

exports.getServices = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) filter.title = new RegExp(search, 'i');
    if (category) filter.category = category;
    const services = await Service.find(filter).populate('providerId','name email');
    res.json(await attachProviderReviewStats(services));
  } catch (err) { next(err); }
};

exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('providerId','name email');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(await attachProviderReviewStats(service));
  } catch (err) { next(err); }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (service.providerId.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    Object.assign(service, req.body);
    await service.save();
    res.json(service);
  } catch (err) { next(err); }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (service.providerId.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await service.deleteOne();
    res.json({ message: 'Service removed' });
  } catch (err) { next(err); }
};
