const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  group: { type: String, default: 'general' },
  label: String
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
