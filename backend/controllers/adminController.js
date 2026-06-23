const User = require('../models/User');
const Service = require('../models/Service');
const Request = require('../models/Request');

exports.getStats = async (req, res, next) => {
  try {
    const users = await User.countDocuments();
    const providers = await User.countDocuments({ role: 'provider' });
    const services = await Service.countDocuments();
    const requests = await Request.countDocuments();
    res.json({ users, providers, services, requests });
  } catch (err) { next(err); }
};
