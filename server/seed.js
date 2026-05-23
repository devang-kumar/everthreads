require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Product  = require('./models/Product');
const Order    = require('./models/Order');

const productData = [
  { productId:1,  name:"Acid Wash Oversized Tee",    category:"men",    price:799,  originalPrice:919,  badge:"sale", tag:"trending", collection:"summer",   sizes:["XS","S","M","L","XL","XXL"], colors:["#1a1a1a","#4a4a4a","#8b0000"], images:["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=533&fit=crop&crop=top"], rating:4.5, numReviews:128, isFeatured:true },
  { productId:2,  name:"Graphic Drop Shoulder Tee",  category:"women",  price:849,  originalPrice:979,  badge:"sale", tag:"new",      collection:"summer",   sizes:["XS","S","M","L","XL"],       colors:["#ffffff","#000000","#2d6a4f"], images:["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=533&fit=crop&crop=top"], rating:4.7, numReviews:94  },
  { productId:3,  name:"Drift Racer Hoodie",         category:"men",    price:1299, originalPrice:1549, badge:"sale", tag:"trending", collection:"drift",    sizes:["S","M","L","XL","XXL"],      colors:["#003566","#1a1a1a","#e63946"], images:["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=533&fit=crop&crop=top"], rating:4.8, numReviews:212, isFeatured:true },
  { productId:4,  name:"Minimal Logo Crop Tee",      category:"women",  price:649,  originalPrice:749,  badge:"sale", tag:"trending", collection:"basics",   sizes:["XS","S","M","L"],            colors:["#f8f9fa","#ffc8dd","#cdb4db"], images:["https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=533&fit=crop&crop=top"], rating:4.6, numReviews:76  },
  { productId:5,  name:"Premium Fleece Joggers",     category:"unisex", price:1099, originalPrice:1299, badge:"sale", tag:"new",      collection:"basics",   sizes:["XS","S","M","L","XL","XXL"], colors:["#1a1a1a","#4a4a4a","#2d3a4a"], images:["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=533&fit=crop&crop=top"], rating:4.4, numReviews:58  },
  { productId:6,  name:"Vintage Wash Sweatshirt",    category:"men",    price:1199, originalPrice:1399, badge:"sale", tag:"new",      collection:"summer",   sizes:["S","M","L","XL","XXL"],      colors:["#8b7355","#4a3728","#2d2d2d"], images:["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=533&fit=crop&crop=top"], rating:4.3, numReviews:41  },
  { productId:7,  name:"Tie-Dye Oversized Tee",      category:"women",  price:799,  originalPrice:919,  badge:"sale", tag:"trending", collection:"summer",   sizes:["XS","S","M","L","XL"],       colors:["#ff6b6b","#ffd93d","#6bcb77"], images:["https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=533&fit=crop&crop=top"], rating:4.5, numReviews:103 },
  { productId:8,  name:"Cargo Utility Shorts",       category:"men",    price:899,  originalPrice:1099, badge:"sale", tag:"new",      collection:"drift",    sizes:["S","M","L","XL","XXL"],      colors:["#4a4a2a","#1a1a1a","#8b7355"], images:["https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&h=533&fit=crop&crop=top"], rating:4.2, numReviews:37  },
  { productId:9,  name:"Anushka's Fav Crop Hoodie",  category:"women",  price:1299, originalPrice:1549, badge:"hot",  tag:"trending", collection:"celebrity",sizes:["XS","S","M","L"],            colors:["#ffc8dd","#cdb4db","#a2d2ff"], images:["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=533&fit=crop&crop=top"], rating:4.9, numReviews:287, isFeatured:true },
  { productId:10, name:"Essential White Tee",        category:"unisex", price:549,  originalPrice:649,  badge:"sale", tag:"basics",   collection:"basics",   sizes:["XS","S","M","L","XL","XXL"], colors:["#ffffff","#f0f0f0","#e0e0e0"], images:["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=533&fit=crop&crop=top"], rating:4.6, numReviews:445 },
  { productId:11, name:"Drift 2.0 Track Jacket",     category:"men",    price:1599, originalPrice:1899, badge:"new",  tag:"new",      collection:"drift",    sizes:["S","M","L","XL","XXL"],      colors:["#003566","#e63946","#1a1a1a"], images:["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=533&fit=crop&crop=top"], rating:4.7, numReviews:62  },
  { productId:12, name:"Summer Society Co-ord Set",  category:"women",  price:1799, originalPrice:2199, badge:"hot",  tag:"trending", collection:"summer",   sizes:["XS","S","M","L"],            colors:["#ffd6a5","#ffb347","#ff6b6b"], images:["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=533&fit=crop&crop=top"], rating:4.8, numReviews:156, isFeatured:true },
  { productId:13, name:"Relaxed Fit Linen Shirt",    category:"men",    price:999,  originalPrice:1199, badge:"sale", tag:"new",      collection:"summer",   sizes:["S","M","L","XL","XXL"],      colors:["#f5f0e8","#d4c5a9","#8b7355"], images:["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=533&fit=crop&crop=top"], rating:4.3, numReviews:29  },
  { productId:14, name:"Ribbed Crop Tank",           category:"women",  price:499,  originalPrice:599,  badge:"sale", tag:"trending", collection:"basics",   sizes:["XS","S","M","L"],            colors:["#1a1a1a","#ffffff","#e63946"], images:["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=533&fit=crop&crop=top"], rating:4.4, numReviews:88  },
  { productId:15, name:"Oversized Graphic Hoodie",   category:"unisex", price:1399, originalPrice:1699, badge:"sale", tag:"trending", collection:"drift",    sizes:["S","M","L","XL","XXL"],      colors:["#2d2d2d","#4a4a4a","#8b0000"], images:["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=533&fit=crop&crop=top"], rating:4.6, numReviews:174 },
  { productId:16, name:"Boxy Striped Tee",           category:"unisex", price:699,  originalPrice:849,  badge:"sale", tag:"new",      collection:"basics",   sizes:["XS","S","M","L","XL"],       colors:["#ffffff","#1a1a1a","#e63946"], images:["https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=533&fit=crop&crop=top"], rating:4.2, numReviews:53  },
  { productId:17, name:"Washed Denim Jacket",        category:"unisex", price:1899, originalPrice:2299, badge:"new",  tag:"new",      collection:"drift",    sizes:["S","M","L","XL"],            colors:["#4a6fa5","#1a1a1a","#8b7355"], images:["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=533&fit=crop&crop=top"], rating:4.7, numReviews:38  },
  { productId:18, name:"Floral Print Midi Dress",    category:"women",  price:1299, originalPrice:1599, badge:"sale", tag:"trending", collection:"summer",   sizes:["XS","S","M","L"],            colors:["#ffd6a5","#a8dadc","#e63946"], images:["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=533&fit=crop&crop=top"], rating:4.5, numReviews:91  },
  { productId:19, name:"Streetwear Cargo Pants",     category:"men",    price:1499, originalPrice:1799, badge:"sale", tag:"trending", collection:"drift",    sizes:["S","M","L","XL","XXL"],      colors:["#1a1a1a","#4a4a2a","#8b7355"], images:["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=533&fit=crop&crop=top"], rating:4.4, numReviews:67  },
  { productId:20, name:"Pastel Oversized Hoodie",      category:"women",      price:1199, originalPrice:1449, badge:"sale", tag:"new",      collection:"basics",   sizes:["XS","S","M","L","XL"],       colors:["#cdb4db","#a2d2ff","#bde0fe"], images:["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=533&fit=crop&crop=top"], rating:4.6, numReviews:112 },
  { productId:21, name:"Streetwear Cap",               category:"accessories", price:499,  originalPrice:699,  badge:"new",  tag:"new",      collection:"drift",    sizes:["Free Size"],                 colors:["#1a1a1a","#ffffff","#e63946"], images:["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=533&fit=crop&crop=top"], rating:4.3, numReviews:45  },
  { productId:22, name:"Logo Tote Bag",                category:"accessories", price:699,  originalPrice:899,  badge:"new",  tag:"new",      collection:"basics",   sizes:["Free Size"],                 colors:["#1a1a1a","#f5f0e8"],           images:["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=533&fit=crop&crop=top"], rating:4.5, numReviews:32  },
  { productId:23, name:"Athletic Crew Socks 3-Pack",   category:"accessories", price:299,  originalPrice:399,  badge:"sale", tag:"trending", collection:"basics",   sizes:["Free Size"],                 colors:["#ffffff","#1a1a1a","#e63946"], images:["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=533&fit=crop&crop=top"], rating:4.4, numReviews:88  },
  { productId:24, name:"Embroidered Bucket Hat",       category:"accessories", price:599,  originalPrice:799,  badge:"new",  tag:"new",      collection:"summer",   sizes:["Free Size"],                 colors:["#4a6fa5","#1a1a1a","#2d6a4f"], images:["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=533&fit=crop&crop=top"], rating:4.2, numReviews:27  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      firstName: 'Admin', lastName: 'BonkersCorner',
      email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD,
      role: 'admin', phone: '+91 98765 00000'
    });
    console.log('Admin created:', admin.email);

    // Create test user
    const testUser = await User.create({
      firstName: 'Rahul', lastName: 'Sharma',
      email: 'rahul@test.com', password: 'Test@123',
      phone: '+91 98765 43210',
      addresses: [{
        label: 'Home', name: 'Rahul Sharma', phone: '+91 98765 43210',
        line1: '42, MG Road, Bandra West', city: 'Mumbai',
        state: 'Maharashtra', pin: '400050', isDefault: true
      }]
    });
    console.log('Test user created:', testUser.email);

    // Create products with variants
    const products = await Product.insertMany(
      productData.map(p => ({
        ...p,
        variants: p.sizes.map(s => ({ size: s, stock: Math.floor(Math.random() * 80) + 20, sku: `BC-${p.productId}-${s}` })),
        description: `Premium quality ${p.name}. Made in India with the finest fabrics. Perfect for everyday streetwear.`
      }))
    );
    console.log(`${products.length} products seeded`);

    // Create sample orders for test user
    const sampleOrders = [
      {
        user: testUser._id, userEmail: testUser.email,
        items: [{ productId: 1, name: 'Acid Wash Oversized Tee', img: productData[0].images[0], price: 799, size: 'M', qty: 2, category: 'men' }],
        address: { name: 'Rahul Sharma', phone: '+91 98765 43210', line1: '42, MG Road', city: 'Mumbai', state: 'Maharashtra', pin: '400050' },
        subtotal: 1598, discount: 0, shipping: 0, codFee: 0, total: 1598,
        paymentMethod: 'razorpay', paymentId: 'pay_demo001', status: 'delivered',
        tracking: [
          { status: 'confirmed', message: 'Order placed', timestamp: new Date(Date.now() - 7*86400000) },
          { status: 'shipped',   message: 'Shipped via BlueDart', timestamp: new Date(Date.now() - 5*86400000) },
          { status: 'delivered', message: 'Delivered successfully', timestamp: new Date(Date.now() - 2*86400000) }
        ]
      },
      {
        user: testUser._id, userEmail: testUser.email,
        items: [{ productId: 3, name: 'Drift Racer Hoodie', img: productData[2].images[0], price: 1299, size: 'L', qty: 1, category: 'men' }],
        address: { name: 'Rahul Sharma', phone: '+91 98765 43210', line1: '42, MG Road', city: 'Mumbai', state: 'Maharashtra', pin: '400050' },
        subtotal: 1299, discount: 0, shipping: 0, codFee: 0, total: 1299,
        paymentMethod: 'cod', status: 'shipped',
        tracking: [
          { status: 'confirmed', message: 'Order placed', timestamp: new Date(Date.now() - 2*86400000) },
          { status: 'shipped',   message: 'Shipped via Delhivery', timestamp: new Date(Date.now() - 86400000) }
        ]
      }
    ];
    await Order.insertMany(sampleOrders);
    console.log('Sample orders created');

    console.log('\n✅ Seed complete!');
    console.log('Admin login:', process.env.ADMIN_EMAIL, '/', process.env.ADMIN_PASSWORD);
    console.log('Test user:   rahul@test.com / Test@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
