// ===== PRODUCT DATABASE (static fallback) =====
const products = [
  { id:1,  name:"Acid Wash Oversized Tee",      category:"men",    price:799,  originalPrice:919,  img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=533&fit=crop&crop=top",    badge:"sale", colors:["#1a1a1a","#4a4a4a","#8b0000"], tag:"trending", collection:"summer",   sizes:["XS","S","M","L","XL","XXL"], rating:4.5, reviews:128 },
  { id:2,  name:"Graphic Drop Shoulder Tee",    category:"women",  price:849,  originalPrice:979,  img:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#ffffff","#000000","#2d6a4f"], tag:"new",      collection:"summer",   sizes:["XS","S","M","L","XL"],       rating:4.7, reviews:94  },
  { id:3,  name:"Drift Racer Hoodie",           category:"men",    price:1299, originalPrice:1549, img:"https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=533&fit=crop&crop=top",      badge:"sale", colors:["#003566","#1a1a1a","#e63946"], tag:"trending", collection:"drift",    sizes:["S","M","L","XL","XXL"],      rating:4.8, reviews:212 },
  { id:4,  name:"Minimal Logo Crop Tee",        category:"women",  price:649,  originalPrice:749,  img:"https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#f8f9fa","#ffc8dd","#cdb4db"], tag:"trending", collection:"basics",   sizes:["XS","S","M","L"],            rating:4.6, reviews:76  },
  { id:5,  name:"Premium Fleece Joggers",       category:"unisex", price:1099, originalPrice:1299, img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=533&fit=crop&crop=top",      badge:"sale", colors:["#1a1a1a","#4a4a4a","#2d3a4a"], tag:"new",      collection:"basics",   sizes:["XS","S","M","L","XL","XXL"], rating:4.4, reviews:58  },
  { id:6,  name:"Vintage Wash Sweatshirt",      category:"men",    price:1199, originalPrice:1399, img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#8b7355","#4a3728","#2d2d2d"], tag:"new",      collection:"summer",   sizes:["S","M","L","XL","XXL"],      rating:4.3, reviews:41  },
  { id:7,  name:"Tie-Dye Oversized Tee",        category:"women",  price:799,  originalPrice:919,  img:"https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#ff6b6b","#ffd93d","#6bcb77"], tag:"trending", collection:"summer",   sizes:["XS","S","M","L","XL"],       rating:4.5, reviews:103 },
  { id:8,  name:"Cargo Utility Shorts",         category:"men",    price:899,  originalPrice:1099, img:"https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#4a4a2a","#1a1a1a","#8b7355"], tag:"new",      collection:"drift",    sizes:["S","M","L","XL","XXL"],      rating:4.2, reviews:37  },
  { id:9,  name:"Anushka's Fav Crop Hoodie",    category:"women",  price:1299, originalPrice:1549, img:"https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=533&fit=crop&crop=top",   badge:"hot",  colors:["#ffc8dd","#cdb4db","#a2d2ff"], tag:"trending", collection:"celebrity", sizes:["XS","S","M","L"],            rating:4.9, reviews:287 },
  { id:10, name:"Essential White Tee",          category:"unisex", price:549,  originalPrice:649,  img:"https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#ffffff","#f0f0f0","#e0e0e0"], tag:"basics",   collection:"basics",   sizes:["XS","S","M","L","XL","XXL"], rating:4.6, reviews:445 },
  { id:11, name:"Drift 2.0 Track Jacket",       category:"men",    price:1599, originalPrice:1899, img:"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=533&fit=crop&crop=top",      badge:"new",  colors:["#003566","#e63946","#1a1a1a"], tag:"new",      collection:"drift",    sizes:["S","M","L","XL","XXL"],      rating:4.7, reviews:62  },
  { id:12, name:"Summer Society Co-ord Set",    category:"women",  price:1799, originalPrice:2199, img:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=533&fit=crop&crop=top",   badge:"hot",  colors:["#ffd6a5","#ffb347","#ff6b6b"], tag:"trending", collection:"summer",   sizes:["XS","S","M","L"],            rating:4.8, reviews:156 },
  { id:13, name:"Relaxed Fit Linen Shirt",      category:"men",    price:999,  originalPrice:1199, img:"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#f5f0e8","#d4c5a9","#8b7355"], tag:"new",      collection:"summer",   sizes:["S","M","L","XL","XXL"],      rating:4.3, reviews:29  },
  { id:14, name:"Ribbed Crop Tank",             category:"women",  price:499,  originalPrice:599,  img:"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#1a1a1a","#ffffff","#e63946"], tag:"trending", collection:"basics",   sizes:["XS","S","M","L"],            rating:4.4, reviews:88  },
  { id:15, name:"Oversized Graphic Hoodie",     category:"unisex", price:1399, originalPrice:1699, img:"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#2d2d2d","#4a4a4a","#8b0000"], tag:"trending", collection:"drift",    sizes:["S","M","L","XL","XXL"],      rating:4.6, reviews:174 },
  { id:16, name:"Boxy Striped Tee",             category:"unisex", price:699,  originalPrice:849,  img:"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#ffffff","#1a1a1a","#e63946"], tag:"new",      collection:"basics",   sizes:["XS","S","M","L","XL"],       rating:4.2, reviews:53  },
  { id:17, name:"Washed Denim Jacket",          category:"unisex", price:1899, originalPrice:2299, img:"https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=533&fit=crop&crop=top",      badge:"new",  colors:["#4a6fa5","#1a1a1a","#8b7355"], tag:"new",      collection:"drift",    sizes:["S","M","L","XL"],            rating:4.7, reviews:38  },
  { id:18, name:"Floral Print Midi Dress",      category:"women",  price:1299, originalPrice:1599, img:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#ffd6a5","#a8dadc","#e63946"], tag:"trending", collection:"summer",   sizes:["XS","S","M","L"],            rating:4.5, reviews:91  },
  { id:19, name:"Streetwear Cargo Pants",       category:"men",    price:1499, originalPrice:1799, img:"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=533&fit=crop&crop=top",   badge:"sale", colors:["#1a1a1a","#4a4a2a","#8b7355"], tag:"trending", collection:"drift",    sizes:["S","M","L","XL","XXL"],      rating:4.4, reviews:67  },
  { id:20, name:"Pastel Oversized Hoodie",      category:"women",      price:1199, originalPrice:1449, img:"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=533&fit=crop&crop=top",      badge:"sale", colors:["#cdb4db","#a2d2ff","#bde0fe"], tag:"new",      collection:"basics",   sizes:["XS","S","M","L","XL"],       rating:4.6, reviews:112 },
  { id:21, name:"Streetwear Cap",               category:"accessories", price:499,  originalPrice:699,  img:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=533&fit=crop&crop=top",  badge:"new",  colors:["#1a1a1a","#ffffff","#e63946"], tag:"new",      collection:"drift",    sizes:["Free Size"],                 rating:4.3, reviews:45  },
  { id:22, name:"Logo Tote Bag",                category:"accessories", price:699,  originalPrice:899,  img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=533&fit=crop&crop=top",      badge:"new",  colors:["#1a1a1a","#f5f0e8"],          tag:"new",      collection:"basics",   sizes:["Free Size"],                 rating:4.5, reviews:32  },
  { id:23, name:"Athletic Crew Socks (3 Pack)", category:"accessories", price:299,  originalPrice:399,  img:"https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=533&fit=crop&crop=top",  badge:"sale", colors:["#ffffff","#1a1a1a","#e63946"], tag:"trending", collection:"basics",   sizes:["Free Size"],                 rating:4.4, reviews:88  },
  { id:24, name:"Embroidered Bucket Hat",       category:"accessories", price:599,  originalPrice:799,  img:"https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=533&fit=crop&crop=top",  badge:"new",  colors:["#4a6fa5","#1a1a1a","#2d6a4f"], tag:"new",     collection:"summer",   sizes:["Free Size"],                 rating:4.2, reviews:27  }
];

// â”€â”€ Normalise API product â†’ local shape â”€â”€
function normaliseProduct(p) {
  return {
    id:            p.productId || p.id,
    _id:           p._id,
    name:          p.name,
    category:      p.category,
    price:         p.price,
    originalPrice: p.originalPrice,
    img:           (p.images && p.images[0]) || p.img || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=533&fit=crop',
    badge:         p.badge || null,
    colors:        p.colors || [],
    tag:           p.tag || 'new',
    collection:    p.collection || '',
    sizes:         p.sizes || [],
    rating:        p.rating || 0,
    reviews:       p.numReviews || (Array.isArray(p.reviews) ? p.reviews.length : 0),
    variants:      p.variants || [],
    isFeatured:    p.isFeatured || false,
    isActive:      p.isActive !== false
  };
}

// â”€â”€ Helpers â”€â”€
function getSavePercent(price, original) {
  return Math.round(((original - price) / original) * 100);
}
function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '' : 'pages/';
}
function renderStars(rating) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5 ? 1 : 0;
  let s = '';
  for (let i = 0; i < full; i++) s += '<i class="fa fa-star"></i>';
  if (half) s += '<i class="fa fa-star-half-alt"></i>';
  return s;
}

// â”€â”€ Product Card â”€â”€
function renderProductCard(product) {
  const save     = getSavePercent(product.price, product.originalPrice);
  const link     = `${getBasePath()}product.html?id=${product.id}`;
  const wishlist = JSON.parse(localStorage.getItem('bc_wishlist') || '[]');
  const isWished = wishlist.includes(product.id);
  const badgeMap = { sale:`SAVE ${save}%`, new:'NEW', hot:'HOT ðŸ”¥' };
  const badgeHTML = product.badge
    ? `<span class="product-badge badge-${product.badge}">${badgeMap[product.badge]}</span>` : '';
  const colorsHTML = (product.colors || []).map((c, i) =>
    `<span class="color-dot ${i===0?'active':''}" style="background:${c}"></span>`
  ).join('');
  return `
    <div class="product-card reveal" data-id="${product.id}" data-category="${product.category}">
      <a href="${link}" class="product-img-wrap">
        <img src="${product.img}" alt="${product.name}" loading="lazy" />
        ${badgeHTML}
        <button class="product-wishlist ${isWished?'active':''}"
          onclick="event.preventDefault();event.stopPropagation();toggleWishlist(this,${product.id})"
          aria-label="Wishlist"><i class="fa fa-heart"></i></button>
        <div class="product-quick-add"
          onclick="event.preventDefault();event.stopPropagation();quickAddToCart(${product.id})">
          + QUICK ADD
        </div>
      </a>
      <div class="product-info">
        <a href="${link}"><h3>${product.name}</h3></a>
        <div class="product-rating-mini">${renderStars(product.rating)}<span>(${product.reviews})</span></div>
        <div class="product-price">
          <span class="price-current">â‚¹${product.price.toLocaleString('en-IN')}</span>
          <span class="price-original">â‚¹${product.originalPrice.toLocaleString('en-IN')}</span>
          <span class="price-save">Save ${save}%</span>
        </div>
        <div class="product-colors">${colorsHTML}</div>
      </div>
    </div>`;
}

// â”€â”€ Quick Add â”€â”€
function quickAddToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  if (!product.sizes || product.sizes.length === 0) { addToCart(productId,'Free Size',1); return; }
  showSizePicker(product);
}
function showSizePicker(product) {
  document.getElementById('sizePicker')?.remove();
  const modal = document.createElement('div');
  modal.id = 'sizePicker'; modal.className = 'size-picker-overlay';
  modal.innerHTML = `
    <div class="size-picker-modal">
      <div class="size-picker-header">
        <span>Select Size â€” ${product.name}</span>
        <button onclick="document.getElementById('sizePicker').remove()"><i class="fa fa-times"></i></button>
      </div>
      <div class="size-picker-options">
        ${product.sizes.map(s => `
          <button class="size-pick-btn"
            onclick="addToCart(${product.id},'${s}',1);document.getElementById('sizePicker').remove()">
            ${s}
          </button>`).join('')}
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// â”€â”€ Populate grids (tries API first, falls back to static) â”€â”€
async function populateGrid(gridId, filter, limit) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  // Show skeleton while loading
  grid.innerHTML = Array(limit || 4).fill(0).map(() => `
    <div class="product-card" style="pointer-events:none">
      <div class="product-img-wrap skeleton" style="aspect-ratio:3/4"></div>
      <div class="product-info">
        <div class="skeleton" style="height:14px;width:80%;margin-bottom:8px;border-radius:4px"></div>
        <div class="skeleton" style="height:12px;width:50%;border-radius:4px"></div>
      </div>
    </div>`).join('');

  try {
    // Build API params
    const params = { limit: limit || 20 };
    if (filter && filter !== 'all') {
      if (['men','women','unisex','accessories'].includes(filter)) {
        params.category = filter;
      } else if (['summer','drift','basics','celebrity'].includes(filter)) {
        params.collection = filter;
      } else {
        params.tag = filter;
      }
    }

    const qs  = new URLSearchParams(params).toString();
    const res = await fetch(`${BC_API}/products?${qs}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.products?.length) {
        const normalised = data.products.map(normaliseProduct);
        // Merge into local products array
        normalised.forEach(np => {
          const idx = products.findIndex(p => p.id === np.id);
          if (idx !== -1) products[idx] = { ...products[idx], ...np };
          else products.push(np);
        });
        grid.innerHTML = normalised.map(renderProductCard).join('');
        if (typeof initReveal === 'function') initReveal();
        return;
      }
    }
  } catch (_) { /* backend offline */ }

  // Static fallback
  let filtered = (!filter || filter === 'all')
    ? [...products]
    : products.filter(p =>
        p.tag === filter ||
        p.category === filter ||
        p.collection === filter
      );
  if (limit) filtered = filtered.slice(0, limit);
  grid.innerHTML = filtered.map(renderProductCard).join('');
  if (typeof initReveal === 'function') initReveal();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('newArrivalsGrid')) populateGrid('newArrivalsGrid','all',8);
  if (document.getElementById('trendingGrid'))    populateGrid('trendingGrid','trending',8);
  if (document.getElementById('basicsGrid'))      populateGrid('basicsGrid','basics',4);
});


