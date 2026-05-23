const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type:    { type: String, required: true }, // 'low_stock','new_order','return_request','review'
  title:   String,
  message: String,
  link:    String,
  isRead:  { type: Boolean, default: false },
  data:    mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
