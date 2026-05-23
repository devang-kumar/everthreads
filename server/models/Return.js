const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnId:    { type: String, unique: true },
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderId:     String,
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail:   String,
  items: [{
    productId: Number,
    name:      String,
    size:      String,
    qty:       Number,
    price:     Number,
    reason:    String,
    img:       String
  }],
  reason:      { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['requested','approved','rejected','picked_up','received','refunded'],
    default: 'requested'
  },
  refundAmount:   Number,
  refundMethod:   { type: String, enum: ['original','wallet','bank'], default: 'original' },
  refundId:       String,
  adminNote:      String,
  images:         [String],
  timeline: [{
    status:    String,
    message:   String,
    timestamp: { type: Date, default: Date.now },
    by:        String
  }]
}, { timestamps: true });

returnSchema.pre('save', function(next) {
  if (!this.returnId) {
    this.returnId = 'RET' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-3).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Return', returnSchema);
