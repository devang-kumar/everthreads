// ===== CHECKOUT ENGINE =====
const COUPONS_CO = {
  'WELCOME15': { pct: 15 },
  'FIRST15':   { pct: 15 },
  'SUMMER20':  { pct: 20 },
  'WELCOME5':  { pct: 5  },
  'FLAT10':    { pct: 10 }
};,
  'FIRST15':  { pct: 15 },
  'SUMMER20': { pct: 20 },
  'WELCOME5': { pct: 5  }
};
let checkoutCoupon = null;

document.addEventListener('DOMContentLoaded', () => {
  renderSummary();

  // Pre-fill saved address
  const saved = JSON.parse(localStorage.getItem('bc_address') || 'null');
  if (saved) {
    ['email','phone','firstName','lastName','addr1','addr2','city','pin'].forEach(id => {
      const el = document.getElementById(id);
      if (el && saved[id]) el.value = saved[id];
    });
    const stateEl = document.getElementById('state');
    if (stateEl && saved.state) stateEl.value = saved.state;
  }

  // PIN code auto-lookup (simulated)
  document.getElementById('pin')?.addEventListener('input', e => {
    const val = e.target.value.replace(/\D/g,'');
    e.target.value = val;
    if (val.length === 6) autoFillCity(val);
  });

  // Phone formatting
  document.getElementById('phone')?.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/[^0-9+]/g,'');
  });
});

// Simulated PIN â†’ city lookup
const pinCities = {
  '400001':'Mumbai','110001':'New Delhi','560001':'Bengaluru',
  '600001':'Chennai','700001':'Kolkata','500001':'Hyderabad',
  '380001':'Ahmedabad','411001':'Pune','302001':'Jaipur'
};
function autoFillCity(pin) {
  const city = pinCities[pin];
  if (city) {
    document.getElementById('city').value = city;
    showToast(`City auto-filled: ${city}`);
  }
}

function renderSummary() {
  const items    = document.getElementById('summaryItems');
  const totals   = document.getElementById('summaryTotals');
  const countEl  = document.getElementById('summaryCount');

  if (!cart.length) {
    items.innerHTML = '<p style="color:#888;font-size:13px;padding:16px 0;">Your cart is empty. <a href="shop.html">Shop now</a></p>';
    return;
  }

  const count = cart.reduce((s,i) => s+i.qty, 0);
  if (countEl) countEl.textContent = `(${count} item${count>1?'s':''})`;

  items.innerHTML = cart.map(item => `
    <div class="summary-item">
      <div class="summary-item-img"><img src="${item.img}" alt="${item.name}" /></div>
      <div class="summary-item-info">
        <h4>${item.name}</h4>
        <p>Size: ${item.size} &nbsp;Â·&nbsp; Qty: ${item.qty}</p>
      </div>
      <span class="summary-item-price">â‚¹${(item.price*item.qty).toLocaleString('en-IN')}</span>
    </div>`).join('');

  updateTotals();
}

function updateTotals() {
  const totals   = document.getElementById('summaryTotals');
  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const discount = checkoutCoupon ? Math.round(subtotal * checkoutCoupon.pct / 100) : 0;
  const payMethod = document.querySelector('input[name=payment]:checked')?.value;
  const prepaidDisc = (payMethod === 'razorpay') ? Math.round((subtotal-discount)*0.05) : 0;
  const codFee   = (payMethod === 'cod') ? 49 : 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total    = subtotal - discount - prepaidDisc + shipping + codFee;

  totals.innerHTML = `
    <div class="total-row"><span>Subtotal</span><span>â‚¹${subtotal.toLocaleString('en-IN')}</span></div>
    ${discount ? `<div class="total-row discount"><span>Coupon (${checkoutCoupon.code})</span><span>âˆ’â‚¹${discount.toLocaleString('en-IN')}</span></div>` : ''}
    ${prepaidDisc ? `<div class="total-row discount"><span>Prepaid Discount (5%)</span><span>âˆ’â‚¹${prepaidDisc.toLocaleString('en-IN')}</span></div>` : ''}
    <div class="total-row"><span>Shipping</span><span>${shipping===0?'<span class="free-tag">FREE</span>':'â‚¹'+shipping}</span></div>
    ${codFee ? `<div class="total-row"><span>COD Fee</span><span>â‚¹${codFee}</span></div>` : ''}
    <div class="total-row grand"><span>Total</span><span>â‚¹${total.toLocaleString('en-IN')}</span></div>
    <p class="savings-note">You save â‚¹${(discount+prepaidDisc+(subtotal>=999?99:0)).toLocaleString('en-IN')} on this order!</p>`;

  // Update button
  document.getElementById('placeOrderBtn').innerHTML =
    `<i class="fa fa-lock"></i> PLACE ORDER â€” â‚¹${total.toLocaleString('en-IN')}`;

  return total;
}

// Listen for payment method change
document.querySelectorAll('input[name=payment]').forEach(r => {
  r.addEventListener('change', updateTotals);
});

function applyCheckoutCoupon() {
  const code = (document.getElementById('couponCode')?.value || '').trim().toUpperCase();
  const msg  = document.getElementById('couponMsg');
  if (COUPONS_CO[code]) {
    checkoutCoupon = { code, ...COUPONS_CO[code] };
    msg.innerHTML  = `<i class="fa fa-check-circle" style="color:#2d6a4f"></i> ${code} applied â€” ${COUPONS_CO[code].pct}% off!`;
    msg.className  = 'coupon-msg success';
    updateTotals();
    showToast(`Coupon ${code} applied! ðŸŽ‰`);
  } else {
    msg.innerHTML  = `<i class="fa fa-times-circle" style="color:#e63946"></i> Invalid coupon code`;
    msg.className  = 'coupon-msg error';
  }
}

function useCoupon(code) {
  document.getElementById('couponCode').value = code;
  applyCheckoutCoupon();
}

// â”€â”€ Validation â”€â”€
function validate() {
  let ok = true;
  const rules = [
    { id:'email',     err:'emailErr',     test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg:'Enter a valid email' },
    { id:'phone',     err:'phoneErr',     test: v => /^[+]?[0-9]{10,13}$/.test(v.replace(/\s/g,'')), msg:'Enter a valid phone number' },
    { id:'firstName', err:'firstNameErr', test: v => v.length >= 2, msg:'Enter your first name' },
    { id:'addr1',     err:'addr1Err',     test: v => v.length >= 5, msg:'Enter your full address' },
    { id:'city',      err:'cityErr',      test: v => v.length >= 2, msg:'Enter your city' },
    { id:'pin',       err:'pinErr',       test: v => /^[0-9]{6}$/.test(v), msg:'Enter a valid 6-digit PIN' },
    { id:'state',     err:'stateErr',     test: v => v !== '', msg:'Select your state' }
  ];
  rules.forEach(r => {
    const el  = document.getElementById(r.id);
    const err = document.getElementById(r.err);
    if (!el) return;
    if (!r.test(el.value.trim())) {
      if (err) err.textContent = r.msg;
      el.classList.add('error');
      ok = false;
    } else {
      if (err) err.textContent = '';
      el.classList.remove('error');
    }
  });
  if (!ok) {
    document.querySelector('.error')?.scrollIntoView({ behavior:'smooth', block:'center' });
  }
  return ok;
}

// â”€â”€ Save address â”€â”€
function saveAddress() {
  const addr = {};
  ['email','phone','firstName','lastName','addr1','addr2','city','pin'].forEach(id => {
    addr[id] = document.getElementById(id)?.value || '';
  });
  addr.state = document.getElementById('state')?.value || '';
  if (document.getElementById('saveAddress')?.checked) {
    localStorage.setItem('bc_address', JSON.stringify(addr));
  }
  return addr;
}

// â”€â”€ Place Order â”€â”€
function placeOrder() {
  if (!cart.length) { showToast('Your cart is empty!'); return; }
  if (!validate()) return;

  const addr      = saveAddress();
  const payMethod = document.querySelector('input[name=payment]:checked')?.value;
  const subtotal  = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const discount  = checkoutCoupon ? Math.round(subtotal * checkoutCoupon.pct / 100) : 0;
  const prepaidDisc = (payMethod === 'razorpay') ? Math.round((subtotal-discount)*0.05) : 0;
  const shipping  = subtotal >= 999 ? 0 : 99;
  const codFee    = (payMethod === 'cod') ? 49 : 0;
  const total     = subtotal - discount - prepaidDisc + shipping + codFee;

  if (payMethod === 'razorpay') {
    initiateRazorpay(total, addr);
  } else {
    // COD
    confirmOrder('COD', 'BC' + Date.now(), total);
  }
}

// â”€â”€ Razorpay Integration â”€â”€
function initiateRazorpay(amount, addr) {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

  // NOTE: In production, create order on your backend and get order_id from Razorpay API
  // For demo, we use client-side only (no real charge will happen without backend)
  const options = {
    key: 'rzp_test_YourKeyHere', // Replace with your Razorpay Test Key
    amount: amount * 100,         // Amount in paise
    currency: 'INR',
    name: 'EVERTHREAD',
    description: `Order of ${cart.length} item(s)`,
    image: 'https://via.placeholder.com/80x80?text=BC',
    // order_id: 'order_xxxx',    // Get from backend in production
    prefill: {
      name:  `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
      email: document.getElementById('email').value,
      contact: document.getElementById('phone').value
    },
    notes: {
      address: `${document.getElementById('addr1').value}, ${document.getElementById('city').value}`
    },
    theme: { color: '#e63946' },
    handler: function(response) {
      // Payment successful
      confirmOrder('ONLINE', response.razorpay_payment_id || 'BC'+Date.now(), amount);
    },
    modal: {
      ondismiss: function() {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa fa-lock"></i> PLACE ORDER â€” â‚¹${amount.toLocaleString('en-IN')}`;
        showToast('Payment cancelled. Try again.');
      }
    }
  };

  try {
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(resp) {
      showToast('Payment failed: ' + resp.error.description, 'error');
      btn.disabled = false;
      btn.innerHTML = `<i class="fa fa-lock"></i> PLACE ORDER â€” â‚¹${amount.toLocaleString('en-IN')}`;
    });
    rzp.open();
  } catch(e) {
    // Razorpay not loaded or key invalid â€” show demo success
    console.warn('Razorpay demo mode:', e.message);
    confirmOrder('DEMO', 'BC' + Date.now(), amount);
  }
}

// â”€â”€ Confirm Order â”€â”€
async function confirmOrder(method, paymentId, amount) {
  const addr = {
    name:  `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
    phone: document.getElementById('phone').value,
    line1: document.getElementById('addr1').value,
    line2: document.getElementById('addr2')?.value || '',
    city:  document.getElementById('city').value,
    pin:   document.getElementById('pin').value,
    state: document.getElementById('state').value
  };

  // Try backend first
  let orderId = 'BC' + Date.now().toString().slice(-8);
  try {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      const res = await OrdersAPI.create({
        items: cart.map(i => ({ productId: i.id, name: i.name, img: i.img, price: i.price, size: i.size, qty: i.qty, category: i.category })),
        address: addr, paymentMethod: method, paymentId,
        couponCode: checkoutCoupon?.code || null
      });
      if (res?.order) orderId = res.order.orderId;
    }
  } catch (_) {}

  // Always save to localStorage as fallback
  const orders = JSON.parse(localStorage.getItem('bc_orders') || '[]');
  orders.unshift({
    id: orderId, paymentId, method, items: [...cart], amount,
    date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
    status: 'Processing', address: addr
  });
  localStorage.setItem('bc_orders', JSON.stringify(orders));

  cart = []; saveCart();
  document.getElementById('successMsg').textContent =
    `Payment ${method === 'COD' ? 'on delivery' : 'successful'}! â‚¹${amount.toLocaleString('en-IN')} ${method === 'COD' ? 'to be paid on delivery' : 'paid'}.`;
  document.getElementById('orderIdDisplay').textContent = `Order ID: ${orderId}`;
  document.getElementById('successModal').classList.add('open');
}



