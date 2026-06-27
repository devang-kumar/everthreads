const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:  { type: Number, required: true },
  name:       { type: String, required: true },
  img:        String,
  price:      { type: Number, required: true },
  size:       { type: String, required: true },
  qty:        { type: Number, required: true, min: 1 },
  category:   String
});

const addressSchema = new mongoose.Schema({
  name:  String,
  phone: String,
  line1: String,
  line2: String,
  city:  String,
  state: String,
  pin:   String
});

const trackingSchema = new mongoose.Schema({
  status:    String,
  message:   String,
  timestamp: { type: Date, default: Date.now },
  location:  String
});

const orderSchema = new mongoose.Schema({
  orderId:       { type: String, unique: true, sparse: true },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail:     String,
  items:         [orderItemSchema],
  address:       addressSchema,
  subtotal:      Number,
  discount:      { type: Number, default: 0 },
  couponCode:    String,
  shipping:      { type: Number, default: 0 },
  codFee:        { type: Number, default: 0 },
  total:         { type: Number, required: true },
  paymentMethod: { type: String, enum: ['razorpay','cod','demo','coins'], required: true },
  paymentId:     String,
  razorpayOrderId: String,
  coinsEarned:   { type: Number, default: 0 },
  coinsRedeemed: { type: Number, default: 0 },
  coinsRefunded: { type: Number, default: 0 },
  rewardRedemption: {
    isReward: { type: Boolean, default: false },
    productId: Number,
    size: String
  },
  status: {
    type: String,
    enum: ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'],
    default: 'pending'
  },
  tracking:      [trackingSchema],
  notes:         String,
  isRefunded:    { type: Boolean, default: false },
  refundAmount:  Number,
  estimatedDelivery: Date
}, { timestamps: true });

// Auto-generate orderId
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'BC' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-3).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
