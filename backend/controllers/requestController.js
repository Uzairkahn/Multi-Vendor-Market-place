const Request = require('../models/Request');
const Service = require('../models/Service');
const Review = require('../models/Review');
const { uploadDeliveryBuffer } = require('../config/cloudinary');

const validStatuses = ['Pending', 'Accepted', 'In Progress', 'Delivered', 'Completed'];

exports.createRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can submit service requests' });
    }
    const { serviceId, requirements, budget, deadline } = req.body;
    if (!serviceId) return res.status(400).json({ message: 'Service ID is required' });
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (!requirements?.trim()) return res.status(400).json({ message: 'Please provide request requirements' });
    const parsedBudget = Number(budget);
    if (budget === undefined || budget === null || Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({ message: 'Please provide a valid budget' });
    }
    const request = await Request.create({
      customerId: req.user.id,
      serviceId,
      requirements: requirements.trim(),
      budget: parsedBudget,
      deadline: deadline?.trim() || ''
    });
    res.status(201).json(request);
  } catch (err) { next(err); }
};

exports.getRequests = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user.id;
    if (req.user.role === 'provider') filter = { serviceId: { $in: await getProviderServiceIds(req.user.id) } };
    const requests = await Request.find(filter).populate('serviceId').populate('customerId','name email');
    if (req.user.role !== 'customer') return res.json(requests);
    const reviews = await Review.find({ customerId: req.user.id }).select('providerId');
    const reviewedProviderIds = new Set(reviews.map((review) => review.providerId.toString()));
    const enrichedRequests = requests.map((request) => {
      const obj = request.toObject();
      const providerId = obj.serviceId?.providerId?.toString?.();
      return {
        ...obj,
        hasReviewedProvider: providerId ? reviewedProviderIds.has(providerId) : false
      };
    });
    res.json(enrichedRequests);
  } catch (err) { next(err); }
};

const getProviderServiceIds = async (providerId) => {
  const services = await Service.find({ providerId }).select('_id');
  return services.map(s => s._id);
};

exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid request status' });
    }
    const request = await Request.findById(id).populate('serviceId');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    const isProviderOwner = request.serviceId?.providerId?.toString() === req.user.id;
    const isCustomerOwner = request.customerId.toString() === req.user.id;
    if (req.user.role === 'admin') {
      request.status = status;
      if (status === 'Completed') request.completedAt = new Date();
      await request.save();
      return res.json(request);
    }
    const providerTransitions = {
      Pending: 'Accepted',
      Accepted: 'In Progress'
    };
    if (isProviderOwner && providerTransitions[request.status] === status) {
      request.status = status;
      await request.save();
      return res.json(request);
    }
    if (isCustomerOwner && request.status === 'Delivered' && status === 'Completed') {
      request.status = 'Completed';
      request.completedAt = new Date();
      await request.save();
      return res.json(request);
    }
    res.status(403).json({ message: `You cannot change this request from ${request.status} to ${status}` });
  } catch (err) { next(err); }
};

exports.deliverRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('serviceId');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    const isProviderOwner = request.serviceId?.providerId?.toString() === req.user.id;
    if (!isProviderOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the service provider can deliver this request' });
    }
    if (request.status !== 'In Progress') {
      return res.status(400).json({ message: 'Only in-progress requests can be delivered' });
    }
    if (!req.file) return res.status(400).json({ message: 'Please upload a delivery file' });
    const deliveryFileUrl = await uploadDeliveryBuffer(req.file);
    request.status = 'Delivered';
    request.deliveryMessage = String(req.body.deliveryMessage || '').trim();
    request.deliveryFileUrl = deliveryFileUrl;
    request.deliveryFileName = req.file.originalname;
    request.deliveredAt = new Date();
    await request.save();
    res.json(request);
  } catch (err) { next(err); }
};
