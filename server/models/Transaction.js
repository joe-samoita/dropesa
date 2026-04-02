const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  amount: { type: Number, required: true },
  phoneNumber: { type: String, required: true },
  accountReference: { type: String },
  transactionDesc: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  rawResponse: { type: mongoose.Schema.Types.Mixed },
  callback: { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model('Transaction', transactionSchema);