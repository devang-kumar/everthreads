const mongoose = require('mongoose');

const paymentAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: String,
  razorpayOrderId: { type: String, required: true, unique: true },
  paymentId: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'verified', 'used', 'failed'],
    default: 'created'
  },
  demo: { type: Boolean, default: false },
  quote: mongoose.Schema.Types.Mixed,
  orderId: String,
  failureReason: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000)
  }
}, { timestamps: true });

paymentAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PaymentAttempt', paymentAttemptSchema);
