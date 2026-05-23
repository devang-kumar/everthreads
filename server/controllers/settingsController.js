const StoreSettings = require('../models/StoreSettings');
const AuditLog = require('../models/AuditLog');

const DEFAULT_SETTINGS = [
  { key: 'store_name', value: 'EverThread', group: 'general', label: 'Store Name' },
  { key: 'store_email', value: 'support@everthread.com', group: 'general', label: 'Support Email' },
  { key: 'store_phone', value: '+91 98765 43210', group: 'general', label: 'Support Phone' },
  { key: 'store_address', value: 'Mumbai, Maharashtra, India', group: 'general', label: 'Store Address' },
  { key: 'currency', value: 'INR', group: 'general', label: 'Currency' },
  { key: 'free_shipping_threshold', value: 999, group: 'shipping', label: 'Free Shipping Above (₹)' },
  { key: 'standard_shipping_fee', value: 99, group: 'shipping', label: 'Standard Shipping Fee (₹)' },
  { key: 'cod_fee', value: 49, group: 'shipping', label: 'COD Fee (₹)' },
  { key: 'prepaid_discount_pct', value: 5, group: 'payment', label: 'Prepaid Discount (%)' },
  { key: 'gst_rate', value: 5, group: 'tax', label: 'GST Rate (%)' },
  { key: 'gst_included', value: true, group: 'tax', label: 'GST Included in Price' },
  { key: 'gstin', value: '', group: 'tax', label: 'GSTIN' },
  { key: 'return_window_days', value: 7, group: 'policy', label: 'Return Window (days)' },
  { key: 'low_stock_alert_threshold', value: 5, group: 'inventory', label: 'Low Stock Alert Threshold' },
  { key: 'maintenance_mode', value: false, group: 'general', label: 'Maintenance Mode' },
  { key: 'announcement_text', value: '🚚 FREE SHIPPING ON ORDERS ABOVE ₹999 • 💳 EXTRA 5% OFF ON PREPAID ORDERS', group: 'general', label: 'Announcement Bar Text' },
  { key: 'meta_title', value: 'EverThread | Unisex Luxury Streetwear', group: 'seo', label: 'Meta Title' },
  { key: 'meta_description', value: 'Unisex luxury streetwear crafted for the bold. Made in India, worn worldwide.', group: 'seo', label: 'Meta Description' },
];

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    // Seed defaults if empty
    const count = await StoreSettings.countDocuments();
    if (count === 0) {
      await StoreSettings.insertMany(DEFAULT_SETTINGS);
    }
    const settings = await StoreSettings.find().sort({ group: 1, key: 1 });
    // Convert to key-value map grouped by group
    const grouped = {};
    settings.forEach(s => {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = { value: s.value, label: s.label, _id: s._id };
    });
    res.json({ success: true, settings, grouped });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: { filter: { key }, update: { $set: { value } }, upsert: true }
    }));
    await StoreSettings.bulkWrite(ops);
    await AuditLog.create({
      admin: req.user._id, adminEmail: req.user.email,
      action: 'UPDATE_SETTINGS', entity: 'StoreSettings',
      details: updates, ip: req.ip
    }).catch(() => {});
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
