const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminEmail: String,
  action:     { type: String, required: true },  // e.g. 'UPDATE_ORDER_STATUS'
  entity:     String,   // e.g. 'Order', 'Product', 'User'
  entityId:   String,
  details:    mongoose.Schema.Types.Mixed,
  ip:         String,
  userAgent:  String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
