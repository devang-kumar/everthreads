// ===== CART ENGINE =====
let cart = JSON.parse(localStorage.getItem('bc_cart') || '[]');

function saveCart() {
  localStorage.setItem('bc_cart', JSON.stringify(cart));
}

// â”€â”€ Add to cart â”€â”€
function addToCart(productId, size, qty) {
  size = size || 'M';
  qty  = qty  || 1;
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const key = `${productId}_${size}`;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      key, id: product.id, name: product.name,
      price: product.price, img: product.img,
      size, qty, category: product.category
    });
  }
  saveCart();
  updateCartUI();
  openCart();
  showToast(`"${product.name}" added to bag ðŸ›ï¸`);
}

// â”€â”€ Remove â”€â”€
function removeFromCart(key) {
  cart = cart.filter(i => i.key !== key);
  saveCart();
  updateCartUI();
}

// â”€â”€ Change qty â”€â”€
function changeQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(key);
  else { saveCart(); updateCartUI(); }
}

// â”€â”€ Cart totals â”€â”€
function getCartSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}
function getCartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

// â”€â”€ Render cart UI â”€â”€
function updateCartUI() {
  const count    = getCartCount();
  const subtotal = getCartSubtotal();

  // Update all count badges on page
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
  const itemCountEl = document.getElementById('cartItemCount');
  if (itemCountEl) itemCountEl.textContent = `(${count})`;
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = `â‚¹${subtotal.toLocaleString('en-IN')}`;

  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <i class="fa fa-shopping-bag"></i>
        <p>Your bag is empty</p>
        <a href="${getBasePath()}shop.html" class="btn-primary" onclick="closeCart()">Start Shopping</a>
      </div>`;
    if (footer) footer.style.display = 'none';
  } else {
    body.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.img}" alt="${item.name}" />
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>Size: <strong>${item.size}</strong></p>
          <div class="cart-item-actions">
            <div class="qty-control">
              <button class="qty-btn" onclick="changeQty('${item.key}',-1)">âˆ’</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="changeQty('${item.key}',1)">+</button>
            </div>
            <span class="cart-item-price">â‚¹${(item.price * item.qty).toLocaleString('en-IN')}</span>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.key}')">
            <i class="fa fa-trash-alt"></i> Remove
          </button>
        </div>
      </div>`).join('');

    if (footer) {
      footer.style.display = 'block';
      // Shipping
      const shipping = subtotal >= 999 ? 0 : 99;
      const discount = appliedCoupon ? Math.round(subtotal * appliedCoupon.pct / 100) : 0;
      const total    = subtotal - discount + shipping;
      footer.innerHTML = `
        <div class="cart-coupon">
          <input type="text" id="cartCouponInput" placeholder="Coupon code" value="${appliedCoupon?appliedCoupon.code:''}" />
          <button onclick="applyCouponFromCart()">APPLY</button>
        </div>
        ${appliedCoupon ? `<div class="coupon-applied"><i class="fa fa-check-circle"></i> ${appliedCoupon.code} applied â€” ${appliedCoupon.pct}% off</div>` : ''}
        <div class="cart-summary-row"><span>Subtotal</span><span>â‚¹${subtotal.toLocaleString('en-IN')}</span></div>
        ${discount ? `<div class="cart-summary-row discount"><span>Discount</span><span>âˆ’â‚¹${discount.toLocaleString('en-IN')}</span></div>` : ''}
        <div class="cart-summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span class="free-ship">FREE</span>' : 'â‚¹'+shipping}</span></div>
        <div class="cart-summary-row total"><span>Total</span><span>â‚¹${total.toLocaleString('en-IN')}</span></div>
        <a href="${getBasePath()}checkout.html" class="btn-primary full-width" onclick="closeCart()">
          PROCEED TO CHECKOUT
        </a>
        <p class="cart-secure"><i class="fa fa-lock"></i> Secure Checkout</p>`;
    }
  }
}

// â”€â”€ Coupon system â”€â”€
const COUPONS = {
  'WELCOME15': { pct: 15, desc: '15% off your first order' },
  'FIRST15':  { pct: 15, desc: '15% off for first order' },
  'SUMMER20': { pct: 20, desc: '20% summer sale' },
  'WELCOME5': { pct: 5,  desc: '5% welcome discount' }
};
let appliedCoupon = null;

function applyCouponFromCart() {
  const code = (document.getElementById('cartCouponInput')?.value || '').trim().toUpperCase();
  if (COUPONS[code]) {
    appliedCoupon = { code, ...COUPONS[code] };
    saveCart();
    updateCartUI();
    showToast(`Coupon ${code} applied! ${COUPONS[code].desc} ðŸŽ‰`);
  } else {
    showToast('Invalid coupon code');
  }
}

// â”€â”€ Open / Close â”€â”€
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// â”€â”€ Wishlist â”€â”€
function toggleWishlist(btn, productId) {
  const wl = JSON.parse(localStorage.getItem('bc_wishlist') || '[]');
  const idx = wl.indexOf(productId);
  if (idx === -1) {
    wl.push(productId);
    btn.classList.add('active');
    showToast('Added to wishlist â¤ï¸');
  } else {
    wl.splice(idx, 1);
    btn.classList.remove('active');
    showToast('Removed from wishlist');
  }
  localStorage.setItem('bc_wishlist', JSON.stringify(wl));
}

// â”€â”€ Toast â”€â”€
function showToast(msg, type) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' toast-'+type : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// â”€â”€ Init â”€â”€
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  document.getElementById('cartToggle')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
});


