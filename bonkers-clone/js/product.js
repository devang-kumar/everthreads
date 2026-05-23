// ===== PRODUCT DETAIL PAGE =====
let detailQty = 1;
let selectedSize = '';
let selectedColor = '';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id     = parseInt(params.get('id')) || 1;

  // Show skeleton
  const mainImg = document.getElementById('mainProductImg');
  if (mainImg) mainImg.style.opacity = '0.3';

  // Try API first
  let product = null;
  try {
    const res = await fetch(`${BC_API}/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.product) {
        product = normaliseProduct(data.product);
        // Also store full API product for reviews
        product._apiData = data.product;
      }
    }
  } catch (_) {}

  // Fallback to static array
  if (!product) {
    const staticP = products.find(p => p.id === id) || products[0];
    product = staticP;
  }

  if (mainImg) mainImg.style.opacity = '1';
  loadProduct(product);
});

function loadProduct(product) {
  document.title = `${product.name} | EVERTHREAD`;

  // Breadcrumb
  const bc = document.getElementById('breadcrumbName');
  if (bc) bc.textContent = product.name;

  // Main image
  const mainImg = document.getElementById('mainProductImg');
  if (mainImg) {
    mainImg.src = product.img || product.images?.[0] || '';
    mainImg.alt = product.name;
    mainImg.style.opacity = '1';
  }

  // Thumbnails
  const thumbRow = document.getElementById('thumbRow');
  if (thumbRow) {
    // Use same image with slight variation for demo
    const imgs = [product.img, product.img.replace('crop=top','crop=center'), product.img.replace('crop=top','crop=bottom')];
    thumbRow.innerHTML = imgs.map((src, i) => `
      <div class="thumb ${i===0?'active':''}" onclick="switchMainImg(this,'${src}')">
        <img src="${src}" alt="view ${i+1}" />
      </div>`).join('');
  }

  // Name, price
  document.getElementById('productName').textContent = product.name;
  document.getElementById('productPrice').textContent = `â‚¹${product.price.toLocaleString('en-IN')}`;
  document.getElementById('productOriginal').textContent = `â‚¹${product.originalPrice.toLocaleString('en-IN')}`;
  const save = getSavePercent(product.price, product.originalPrice);
  document.getElementById('productSave').textContent = `Save ${save}%`;

  // Rating
  const ratingEl = document.getElementById('productRating');
  if (ratingEl) {
    ratingEl.innerHTML = `
      <span class="stars-detail">${renderStars(product.rating)}</span>
      <span class="rating-num">${product.rating}</span>
      <a href="#reviews" class="rating-count">(${product.reviews} reviews)</a>`;
  }

  // Colors
  selectedColor = product.colors[0];
  const colorWrap = document.getElementById('colorOptions');
  if (colorWrap) {
    colorWrap.innerHTML = product.colors.map((c, i) => `
      <button class="color-option ${i===0?'active':''}" style="background:${c}"
        onclick="selectColor(this,'${c}')" title="${c}" aria-label="Color ${c}"></button>`
    ).join('');
  }

  // Sizes
  selectedSize = product.sizes ? product.sizes[0] : 'M';
  const sizeWrap = document.getElementById('sizeOptions');
  if (sizeWrap && product.sizes) {
    sizeWrap.innerHTML = product.sizes.map((s, i) => `
      <button class="size-btn ${i===0?'active':''}" onclick="selectSize(this,'${s}')">${s}</button>`
    ).join('');
  }
  const selSizeEl = document.getElementById('selectedSize');
  if (selSizeEl) selSizeEl.textContent = selectedSize;

  // Add to bag
  document.getElementById('addToBagBtn')?.addEventListener('click', () => {
    if (!selectedSize) { showToast('Please select a size', 'error'); return; }
    addToCart(product.id, selectedSize, detailQty);
  });

  // Buy now
  document.getElementById('buyNowBtn')?.addEventListener('click', () => {
    if (!selectedSize) { showToast('Please select a size', 'error'); return; }
    addToCart(product.id, selectedSize, detailQty);
    window.location.href = 'checkout.html';
  });

  // Wishlist
  const wl = JSON.parse(localStorage.getItem('bc_wishlist') || '[]');
  const wishBtn = document.getElementById('wishlistBtn');
  if (wishBtn) {
    if (wl.includes(product.id)) wishBtn.classList.add('active');
    wishBtn.addEventListener('click', () => {
      toggleWishlist(wishBtn, product.id);
    });
  }

  // Related products
  const relGrid = document.getElementById('relatedGrid');
  if (relGrid) {
    const related = products
      .filter(p => p.id !== product.id && (p.category === product.category || p.collection === product.collection))
      .slice(0, 4);
    relGrid.innerHTML = related.map(renderProductCard).join('');
    initReveal();
  }

  // Reviews section
  renderReviews(product);
}

function switchMainImg(thumb, src) {
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  const mainImg = document.getElementById('mainProductImg');
  if (mainImg) mainImg.src = src;
}

function selectSize(btn, size) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = size;
  const el = document.getElementById('selectedSize');
  if (el) el.textContent = size;
}

function selectColor(btn, color) {
  document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedColor = color;
}

function changeDetailQty(delta) {
  detailQty = Math.max(1, Math.min(10, detailQty + delta));
  const el = document.getElementById('detailQty');
  if (el) el.textContent = detailQty;
}

function toggleAccordion(btn) {
  const body   = btn.nextElementSibling;
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.accordion-header').forEach(b => b.classList.remove('open'));
  if (!isOpen) { body.classList.add('open'); btn.classList.add('open'); }
}

// â”€â”€ Fake reviews â”€â”€
const fakeReviews = [
  { name:'Priya S.',    rating:5, date:'12 May 2026', text:'Absolutely love the quality! Fits perfectly and the fabric is so soft. Will definitely order again.' },
  { name:'Rahul M.',    rating:4, date:'8 May 2026',  text:'Great product, fast delivery. The color is exactly as shown. Slightly oversized but that\'s the style.' },
  { name:'Ananya K.',   rating:5, date:'3 May 2026',  text:'Best streetwear brand in India hands down. The packaging was also super cute!' },
  { name:'Vikram T.',   rating:4, date:'28 Apr 2026', text:'Good quality for the price. Washed it twice and no fading. Happy with the purchase.' },
  { name:'Sneha R.',    rating:5, date:'20 Apr 2026', text:'Ordered for my boyfriend and he loved it. The oversized fit is perfect. Highly recommend!' }
];

function renderReviews(product) {
  const section = document.getElementById('reviewsSection');
  if (!section) return;
  const avg = product.rating;
  section.innerHTML = `
    <div class="reviews-header">
      <div class="reviews-avg">
        <span class="avg-num">${avg}</span>
        <div class="avg-stars">${renderStars(avg)}</div>
        <span class="avg-count">Based on ${product.reviews} reviews</span>
      </div>
      <div class="rating-bars">
        ${[5,4,3,2,1].map(n => {
          const pct = n === 5 ? 62 : n === 4 ? 24 : n === 3 ? 9 : n === 2 ? 3 : 2;
          return `<div class="rating-bar-row">
            <span>${n} <i class="fa fa-star"></i></span>
            <div class="rating-bar"><div class="rating-bar-fill" style="width:${pct}%"></div></div>
            <span>${pct}%</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="reviews-list">
      ${fakeReviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <div class="reviewer-avatar">${r.name[0]}</div>
            <div>
              <strong>${r.name}</strong>
              <div class="review-stars">${renderStars(r.rating)}</div>
            </div>
            <span class="review-date">${r.date}</span>
          </div>
          <p>${r.text}</p>
        </div>`).join('')}
    </div>
    <button class="btn-outline-dark" onclick="showToast('Login to write a review')">Write a Review</button>`;
}



