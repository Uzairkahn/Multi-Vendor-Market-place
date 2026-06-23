const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  requirements: String,
  budget: Number,
  deadline: Date,
  status: { type: String, enum: ['Pending','Accepted','In Progress','Delivered','Completed'], default: 'Pending' },
  deliveryMessage: { type: String, default: '' },
  deliveryFileUrl: { type: String, default: '' },
  deliveryFileName: { type: String, default: '' },
  deliveredAt: Date,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
