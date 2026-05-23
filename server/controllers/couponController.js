const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');

const audit = (req, action, entity, entityId, details) =>
  AuditLog.create({ admin: req.user._id, adminEmail: req.user.email, action, entity, entityId: String(entityId), details, ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});

// GET /api/admin/coupons
exports.getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = {};
    if (search) query.code = { $regex: search, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit);
    res.json({ success: true, total, coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/admin/coupons
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    await audit(req, 'CREATE_COUPON', 'Coupon', coupon._id, { code: coupon.code });
    res.status(201).json({ success: true, coupon });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// PUT /api/admin/coupons/:id
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await audit(req, 'UPDATE_COUPON', 'Coupon', coupon._id, { code: coupon.code });
    res.json({ success: true, coupon });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// DELETE /api/admin/coupons/:id
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await audit(req, 'DELETE_COUPON', 'Coupon', req.params.id, { code: coupon.code });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/coupons/validate  (public — for checkout)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderValue, userId } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const now = new Date();
    if (coupon.validUntil && now > coupon.validUntil)
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    if (coupon.validFrom && now < coupon.validFrom)
      return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (orderValue < coupon.minOrderValue)
      return res.status(400).json({ success: false, message: `Minimum order value ₹${coupon.minOrderValue} required` });
    if (userId && coupon.perUserLimit > 0) {
      const userUsage = coupon.usedBy.filter(id => id.toString() === userId).length;
      if (userUsage >= coupon.perUserLimit)
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    let discount = coupon.type === 'percentage'
      ? Math.round(orderValue * coupon.value / 100)
      : coupon.value;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;

    res.json({ success: true, discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
