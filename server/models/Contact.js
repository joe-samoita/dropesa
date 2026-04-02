const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pairedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pairingToken: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['PENDING', 'PAIRED'], default: 'PAIRED' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);
