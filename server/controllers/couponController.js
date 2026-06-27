const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');
const {
  CheckoutError,
  buildOrderQuote,
  calculateCouponDiscount
} = require('../utils/orderPricing');

const audit = (req, action, entity, entityId, details) =>
  AuditLog.create({
    admin: req.user._id,
    adminEmail: req.user.email,
    action,
    entity,
    entityId: String(entityId),
    details,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  }).catch(() => {});

exports.getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = {};
    if (search) query.code = { $regex: search, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit);
    res.json({ success: true, total, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    await audit(req, 'CREATE_COUPON', 'Coupon', coupon._id, { code: coupon.code });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await audit(req, 'UPDATE_COUPON', 'Coupon', coupon._id, { code: coupon.code });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await audit(req, 'DELETE_COUPON', 'Coupon', req.params.id, { code: coupon.code });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, items, orderValue, paymentMethod = 'razorpay' } = req.body;
    let result;

    if (items?.length) {
      const quote = await buildOrderQuote({
        items,
        couponCode: code,
        paymentMethod,
        userId: req.user._id
      });
      result = {
        discount: quote.couponDiscount,
        coupon: quote.coupon
          ? {
              code: quote.coupon.code,
              type: quote.coupon.type,
              value: quote.coupon.value,
              description: quote.coupon.description
            }
          : { code: quote.couponCode, type: 'percentage', description: 'Promotional discount' }
      };
    } else {
      result = await calculateCouponDiscount({
        code,
        subtotal: Number(orderValue) || 0,
        userId: req.user._id
      });
      result = {
        discount: result.discount,
        coupon: result.coupon
          ? {
              code: result.coupon.code,
              type: result.coupon.type,
              value: result.coupon.value,
              description: result.coupon.description
            }
          : { code: result.code, type: 'percentage', description: 'Promotional discount' }
      };
    }

    res.json({ success: true, discount: result.discount, coupon: result.coupon });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
