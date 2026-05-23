const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:   String,
  type:          { type: String, enum: ['percentage', 'flat'], required: true },
  value:         { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount:   { type: Number },           // cap for percentage coupons
  usageLimit:    { type: Number, default: 0 }, // 0 = unlimited
  usedCount:     { type: Number, default: 0 },
  perUserLimit:  { type: Number, default: 1 },
  isActive:      { type: Boolean, default: true },
  validFrom:     { type: Date, default: Date.now },
  validUntil:    { type: Date },
  applicableCategories: [String],            // empty = all categories
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
