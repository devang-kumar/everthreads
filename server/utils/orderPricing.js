const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const LEGACY_COUPONS = {
  WELCOME15: { pct: 15 },
  FIRST15: { pct: 15 },
  SUMMER20: { pct: 20 },
  WELCOME5: { pct: 5 },
  FLAT10: { pct: 10 },
  SHARK10: { pct: 10 }
};

const ONLINE_PAYMENT_METHODS = new Set(['razorpay', 'demo']);

class CheckoutError extends Error {
  constructor(message, status = 400, details = {}) {
    super(message);
    this.status = status;
    Object.assign(this, details);
  }
}

function normalizePaymentMethod(paymentMethod = 'razorpay') {
  const method = String(paymentMethod).toLowerCase();
  if (['cod', 'razorpay', 'demo', 'coins'].includes(method)) return method;
  if (['upi', 'card', 'netbanking', 'wallet'].includes(method)) return 'razorpay';
  throw new CheckoutError('Unsupported payment method');
}

function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CheckoutError('No items in order');
  }

  const byVariant = new Map();
  for (const raw of items) {
    const productId = Number(raw.productId);
    const size = String(raw.size || '').trim();
    const qty = Number(raw.qty);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new CheckoutError('Invalid product in cart');
    }
    if (!size) {
      throw new CheckoutError('Please choose a size for every item');
    }
    if (!Number.isInteger(qty) || qty < 1) {
      throw new CheckoutError('Invalid item quantity');
    }

    const key = `${productId}:${size}`;
    const existing = byVariant.get(key);
    if (existing) existing.qty += qty;
    else byVariant.set(key, { productId, size, qty });
  }

  return [...byVariant.values()];
}

async function calculateCouponDiscount({ code, subtotal, items = [], userId }) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) {
    return { code: undefined, discount: 0, coupon: null, legacy: false };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
  if (coupon) {
    const now = new Date();
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new CheckoutError('Coupon has expired');
    }
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new CheckoutError('Coupon is not yet active');
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new CheckoutError('Coupon usage limit reached');
    }
    if (subtotal < (coupon.minOrderValue || 0)) {
      throw new CheckoutError(`Minimum order value Rs ${coupon.minOrderValue} required`);
    }
    if (userId && coupon.perUserLimit > 0) {
      const userUsage = (coupon.usedBy || []).filter(id => id.toString() === userId.toString()).length;
      if (userUsage >= coupon.perUserLimit) {
        throw new CheckoutError('You have already used this coupon');
      }
    }

    const applicableCategories = coupon.applicableCategories || [];
    const eligibleSubtotal = applicableCategories.length && items.length
      ? items
          .filter(item => applicableCategories.includes(item.category))
          .reduce((sum, item) => sum + item.price * item.qty, 0)
      : subtotal;

    if (eligibleSubtotal <= 0) {
      throw new CheckoutError('Coupon is not valid for these items');
    }

    let discount = coupon.type === 'percentage'
      ? Math.round(eligibleSubtotal * coupon.value / 100)
      : Math.min(coupon.value, eligibleSubtotal);
    if (coupon.maxDiscount && coupon.type === 'percentage') {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    return {
      code: coupon.code,
      discount: Math.min(discount, subtotal),
      coupon,
      legacy: false
    };
  }

  const legacy = LEGACY_COUPONS[normalizedCode];
  if (legacy) {
    return {
      code: normalizedCode,
      discount: Math.round(subtotal * legacy.pct / 100),
      coupon: null,
      legacy: true
    };
  }

  throw new CheckoutError('Invalid coupon code', 404);
}

async function buildOrderQuote({ items, couponCode, paymentMethod = 'razorpay', userId }) {
  const method = normalizePaymentMethod(paymentMethod);
  if (method === 'coins') {
    throw new CheckoutError('Use rewards redemption to place coin orders');
  }

  const requestedItems = normalizeCartItems(items);
  const products = await Product.find({
    productId: { $in: [...new Set(requestedItems.map(item => item.productId))] },
    isActive: true
  }).select('productId name price images category variants');
  const productsById = new Map(products.map(product => [product.productId, product]));

  const canonicalItems = requestedItems.map(item => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CheckoutError('One of the products in your cart is no longer available', 409);
    }

    const variant = product.variants.find(v => v.size === item.size);
    if (!variant) {
      throw new CheckoutError(`${product.name} is not available in size ${item.size}`, 409);
    }
    if ((variant.stock || 0) < item.qty) {
      throw new CheckoutError(`${product.name} (${item.size}) only has ${variant.stock || 0} left in stock`, 409, {
        productId: item.productId,
        size: item.size,
        available: variant.stock || 0
      });
    }

    return {
      productId: product.productId,
      name: product.name,
      img: product.images?.[0] || '',
      price: product.price,
      size: item.size,
      qty: item.qty,
      category: product.category
    };
  });

  const subtotal = canonicalItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const coupon = await calculateCouponDiscount({
    code: couponCode,
    subtotal,
    items: canonicalItems,
    userId
  });
  const prepaidDiscount = ONLINE_PAYMENT_METHODS.has(method) ? Math.round(subtotal * 0.05) : 0;
  const discount = Math.min(subtotal, coupon.discount + prepaidDiscount);
  const shipping = subtotal >= 999 ? 0 : 99;
  const codFee = method === 'cod' ? 49 : 0;
  const total = Math.max(0, subtotal - discount + shipping + codFee);

  return {
    items: canonicalItems,
    subtotal,
    couponDiscount: coupon.discount,
    prepaidDiscount,
    discount,
    couponCode: coupon.code,
    coupon: coupon.coupon,
    couponIsLegacy: coupon.legacy,
    shipping,
    codFee,
    total,
    paymentMethod: method
  };
}

function quoteSummary(quote) {
  return {
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    couponDiscount: quote.couponDiscount,
    prepaidDiscount: quote.prepaidDiscount,
    shipping: quote.shipping,
    codFee: quote.codFee,
    total: quote.total,
    couponCode: quote.couponCode
  };
}

function assertClientTotals(quote, clientTotals = {}) {
  const fields = ['subtotal', 'discount', 'shipping', 'codFee', 'total'];
  for (const field of fields) {
    if (clientTotals[field] === undefined || clientTotals[field] === null || clientTotals[field] === '') continue;
    if (Math.round(Number(clientTotals[field])) !== Math.round(Number(quote[field]))) {
      throw new CheckoutError('Cart totals changed. Please review checkout again.', 409, {
        quote: quoteSummary(quote)
      });
    }
  }
}

async function markCouponUsed(coupon, userId) {
  if (!coupon?._id) return;
  await Coupon.updateOne(
    { _id: coupon._id },
    { $inc: { usedCount: 1 }, $push: { usedBy: userId } }
  );
}

module.exports = {
  CheckoutError,
  buildOrderQuote,
  calculateCouponDiscount,
  assertClientTotals,
  markCouponUsed,
  normalizePaymentMethod,
  quoteSummary
};
