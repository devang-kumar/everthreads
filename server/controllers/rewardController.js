const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const InventoryLog = require('../models/Inventory');

const REWARD_COST = 800;

const userPayload = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  coins: user.coins || 0,
  wishlist: user.wishlist,
  addresses: user.addresses
});

// @GET /api/rewards
exports.getRewards = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('productId name price originalPrice images category variants sizes colors slug')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(24);

    res.json({
      success: true,
      coins: req.user.coins || 0,
      rewardCost: REWARD_COST,
      products: products.filter(p => (p.variants || []).some(v => v.stock > 0))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/rewards/redeem
exports.redeemReward = async (req, res) => {
  let debitedUserId = null;
  let debitedProductId = null;
  let debitedSize = null;
  try {
    const { productId, size, address } = req.body;
    if (!productId || !size) {
      return res.status(400).json({ success: false, message: 'Product and size are required' });
    }
    if (!address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.state || !address?.pin) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    let user = await User.findOneAndUpdate(
      { _id: req.user._id, coins: { $gte: REWARD_COST } },
      { $inc: { coins: -REWARD_COST } },
      { new: true }
    );
    if (!user) {
      return res.status(400).json({ success: false, message: `You need ${REWARD_COST} coins to redeem an item` });
    }
    debitedUserId = user._id;

    const product = await Product.findOneAndUpdate(
      {
        productId: +productId,
        isActive: true,
        variants: { $elemMatch: { size, stock: { $gt: 0 } } }
      },
      { $inc: { 'variants.$.stock': -1, totalSold: 1 } },
      { new: false }
    );
    if (!product) {
      user = await User.findByIdAndUpdate(user._id, { $inc: { coins: REWARD_COST } }, { new: true });
      return res.status(400).json({ success: false, message: 'Selected reward item is not available' });
    }
    debitedProductId = product.productId;
    debitedSize = size;

    const variant = product.variants.find(v => v.size === size);
    const before = variant.stock;

    const item = {
      productId: product.productId,
      name: product.name,
      img: product.images?.[0],
      price: 0,
      size,
      qty: 1,
      category: product.category
    };

    const order = await Order.create({
      user: user._id,
      userEmail: user.email,
      items: [item],
      address,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      codFee: 0,
      total: 0,
      paymentMethod: 'coins',
      coinsRedeemed: REWARD_COST,
      rewardRedemption: { isReward: true, productId: product.productId, size },
      status: 'confirmed',
      tracking: [{
        status: 'confirmed',
        message: `${REWARD_COST} coins redeemed for reward item`,
        location: 'Warehouse',
        timestamp: new Date()
      }],
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    await InventoryLog.create({
      productId: product.productId,
      productName: product.name,
      size,
      type: 'sale',
      qty: 1,
      before,
      after: before - 1,
      orderId: order.orderId,
      note: `Reward redemption (${REWARD_COST} coins)`,
      createdBy: user._id
    }).catch(() => {});

    res.status(201).json({
      success: true,
      order,
      coinsBalance: user.coins,
      user: userPayload(user),
      message: 'Reward item redeemed successfully'
    });
  } catch (err) {
    if (debitedUserId) {
      await User.findByIdAndUpdate(debitedUserId, { $inc: { coins: REWARD_COST } }).catch(() => {});
    }
    if (debitedProductId && debitedSize) {
      await Product.updateOne(
        { productId: debitedProductId, 'variants.size': debitedSize },
        { $inc: { 'variants.$.stock': 1, totalSold: -1 } }
      ).catch(() => {});
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
