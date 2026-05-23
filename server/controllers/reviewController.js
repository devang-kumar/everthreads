const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// GET /api/admin/reviews
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, search } = req.query;
    const skip = (page - 1) * limit;

    const matchStage = {};
    if (rating) matchStage['reviews.rating'] = +rating;
    if (search) matchStage['reviews.name'] = { $regex: search, $options: 'i' };

    const pipeline = [
      { $unwind: '$reviews' },
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      { $project: {
        productId: 1, productName: '$name', productImg: { $arrayElemAt: ['$images', 0] },
        review: '$reviews'
      }},
      { $sort: { 'review.createdAt': -1 } },
      { $facet: {
        data: [{ $skip: skip }, { $limit: +limit }],
        total: [{ $count: 'count' }]
      }}
    ];

    const result = await Product.aggregate(pipeline);
    const reviews = result[0]?.data || [];
    const total = result[0]?.total[0]?.count || 0;
    res.json({ success: true, total, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/admin/reviews/:productId/:reviewId
exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: +req.params.productId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.reviews = product.reviews.filter(r => r._id.toString() !== req.params.reviewId);
    product.updateRating();
    await product.save();
    await AuditLog.create({ admin: req.user._id, adminEmail: req.user.email, action: 'DELETE_REVIEW', entity: 'Product', entityId: String(product.productId), ip: req.ip }).catch(() => {});
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/admin/reviews/:productId/:reviewId/approve
exports.approveReview = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: +req.params.productId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.verified = true;
    await product.save();
    res.json({ success: true, message: 'Review approved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
