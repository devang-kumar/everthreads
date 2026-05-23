const Product      = require('../models/Product');
const InventoryLog = require('../models/Inventory');

// @GET /api/products  (public — active only; admin gets all)
exports.getProducts = async (req, res) => {
  try {
    const { category, collection, tag, search, minPrice, maxPrice, sort, page = 1, limit = 20, rating } = req.query;

    // Admin can see inactive products too
    const isAdmin = req.headers.authorization && (() => {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        return decoded.role === 'admin';
      } catch(_) { return false; }
    })();

    const query = isAdmin ? {} : { isActive: true };

    if (category)  query.category   = category;
    if (collection)query.collection = collection;
    if (tag)       query.tag        = tag;

    // Smart search — split into words, skip stop words, match any word across multiple fields
    if (search) {
      const STOP_WORDS = new Set(['for','the','a','an','and','or','in','of','to','with','by','on','at','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','dare','ought','used','men','women','unisex']);
      // Simple stemmer — strip common suffixes to get root
      const stem = w => w.replace(/ies$/i,'y').replace(/ves$/i,'f').replace(/ses$|xes$|zes$|ches$|shes$/i,'').replace(/s$/i,'');
      const words = search.trim().split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));
      if (words.length === 0) {
        query.name = { $regex: search.trim(), $options: 'i' };
      } else {
        // For each meaningful word, also try its stemmed form
        const patterns = [...new Set(words.flatMap(w => [w, stem(w)].filter(Boolean)))];
        query.$or = patterns.flatMap(word => [
          { name:        { $regex: word, $options: 'i' } },
          { description: { $regex: word, $options: 'i' } },
          { tag:         { $regex: word, $options: 'i' } },
          { collection:  { $regex: word, $options: 'i' } },
          { category:    { $regex: word, $options: 'i' } },
        ]);
      }
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = +minPrice;
      if (maxPrice) query.price.$lte = +maxPrice;
    }
    if (rating)    query.rating     = { $gte: +rating };

    const sortMap = {
      'price-low':  { price: 1 },
      'price-high': { price: -1 },
      'newest':     { createdAt: -1 },
      'discount':   { originalPrice: -1 },
      'rating':     { rating: -1 },
      'default':    { isFeatured: -1, createdAt: -1 }
    };
    const sortObj = sortMap[sort] || sortMap['default'];

    const skip  = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(+limit);

    res.json({ success: true, total, page: +page, pages: Math.ceil(total / limit), products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ productId: +req.params.id }, { slug: req.params.id }],
      isActive: true
    }).populate('reviews.user', 'firstName lastName');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/products  (admin)
exports.createProduct = async (req, res) => {
  try {
    // Auto-assign productId
    const last = await Product.findOne().sort({ productId: -1 });
    req.body.productId = (last?.productId || 0) + 1;

    // Build variants from sizes
    if (req.body.sizes && !req.body.variants?.length) {
      req.body.variants = req.body.sizes.map(s => ({ size: s, stock: req.body.defaultStock || 50 }));
    }
    const product = await Product.create(req.body);

    // Log inventory
    for (const v of product.variants) {
      await InventoryLog.create({
        productId: product.productId, productName: product.name,
        size: v.size, type: 'restock', qty: v.stock, before: 0, after: v.stock,
        note: 'Initial stock', createdBy: req.user._id
      });
    }
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/products/:id  (admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @DELETE /api/products/:id  (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/products/:id/review
exports.addReview = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: +req.params.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const already = product.reviews.find(r => r.user?.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ success: false, message: 'Already reviewed' });

    product.reviews.push({
      user: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      rating: req.body.rating,
      comment: req.body.comment,
      verified: true
    });
    product.updateRating();
    await product.save();
    res.status(201).json({ success: true, reviews: product.reviews, rating: product.rating });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
