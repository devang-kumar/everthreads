const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },
  name:     String,
  phone:    String,
  line1:    { type: String, required: true },
  line2:    String,
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pin:      { type: String, required: true },
  isDefault:{ type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  dob:       Date,
  gender:    { type: String, enum: ['male','female','non-binary','prefer-not-to-say'] },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  addresses: [addressSchema],
  wishlist:  [{ type: Number }],   // product IDs
  coins:     { type: Number, default: 0, min: 0 },
  isActive:  { type: Boolean, default: true },
  lastLogin: Date,
  resetPasswordToken:   String,
  resetPasswordExpire:  Date
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

// Generate JWT
userSchema.methods.getSignedToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Virtual: full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
