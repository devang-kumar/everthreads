// Dynamically load Razorpay checkout script
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay checkout modal
 * @param {object} opts
 * @param {string} opts.key          - Razorpay Key ID
 * @param {object} opts.order        - Razorpay order object { id, amount, currency }
 * @param {number} opts.amount       - Amount in INR (fallback if order.amount missing)
 * @param {string} opts.currency     - 'INR'
 * @param {string} opts.name         - Store name
 * @param {string} opts.description  - Payment description
 * @param {object} opts.prefill      - { name, email, phone }
 * @param {object} opts.theme        - { color }
 * @param {string} opts.selectedMethod - 'upi' | 'card' | 'netbanking' | 'wallet' | null
 * @returns {Promise<{razorpay_order_id, razorpay_payment_id, razorpay_signature}>}
 */
export function openRazorpayCheckout({ key, order, amount, currency = 'INR', name, description, prefill, theme, selectedMethod }) {
  return new Promise((resolve, reject) => {

    // Map our method names to Razorpay method keys
    const methodMap = {
      upi:        { upi: true },
      card:       { card: true },
      netbanking: { netbanking: true },
      wallet:     { wallet: true },
    }

    const options = {
      key,
      amount:      order.amount || Math.round(amount * 100), // already in paise from backend
      currency,
      name:        name        || 'EverThread',
      description: description || 'Order Payment',
      image:       '/favicon.svg',
      order_id:    order.id,

      prefill: {
        name:    prefill?.name  || '',
        email:   prefill?.email || '',
        contact: prefill?.phone || '',
      },

      theme: { color: theme?.color || '#e63946' },

      // Pre-open on the selected tab if user picked one
      ...(selectedMethod && methodMap[selectedMethod]
        ? { method: methodMap[selectedMethod] }
        : {}
      ),

      handler(response) {
        resolve({
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
        })
      },

      modal: {
        backdropclose: false,
        escape:        false,
        ondismiss() {
          reject(new Error('Payment cancelled by user'))
        }
      },

      // Notes visible in Razorpay dashboard
      notes: {
        store: 'EverThread',
      },
    }

    const rzp = new window.Razorpay(options)

    rzp.on('payment.failed', (response) => {
      reject(new Error(
        response.error?.description ||
        response.error?.reason      ||
        'Payment failed'
      ))
    })

    rzp.open()
  })
}
