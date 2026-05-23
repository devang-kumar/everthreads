const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size:     { type: String, required: true },
  stock:    { type: Number, default: 0, min: 0 },
  sku:      String,
  reserved: { type: Number, default: 0 }
});

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:    String,
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  verified:{ type: Boolean, default: false }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  productId:    { type: Number, unique: true },   // matches frontend id
  name:         { type: String, required: true, trim: true },
  slug:         { type: String, unique: true, sparse: true },
  description:  String,
  category:     { type: String, required: true, enum: ['men','women','unisex','accessories'] },
  collection:   String,
  tag:          String,
  price:        { type: Number, required: true, min: 0 },
  originalPrice:{ type: Number, required: true },
  badge:        { type: String, enum: ['sale','new','hot',null] },
  images:       [String],
  colors:       [String],
  sizes:        [String],
  variants:     [variantSchema],
  reviews:      [reviewSchema],
  rating:       { type: Number, default: 0 },
  numReviews:   { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },
  lowStockAlert:{ type: Number, default: 5 },
  totalSold:    { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Update rating when reviews change
productSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) { this.rating = 0; this.numReviews = 0; return; }
  this.numReviews = this.reviews.length;
  this.rating = this.reviews.reduce((s, r) => s + r.rating, 0) / this.numReviews;
};

// Get total stock
productSchema.virtual('totalStock').get(function() {
  return (this.variants || []).reduce((s, v) => s + v.stock, 0);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
