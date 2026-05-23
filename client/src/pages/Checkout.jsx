import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import api from '../utils/api'
import { fmt } from '../utils/format'
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay'
import toast from 'react-hot-toast'
import './Checkout.css'

const PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'UPI Payment',
    sub: 'GPay, PhonePe, Paytm, BHIM & more',
    icon: 'fa-mobile-alt',
    badge: 'INSTANT',
    badgeColor: '#166534',
    discount: true,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sub: 'Visa, Mastercard, RuPay, Amex',
    icon: 'fa-credit-card',
    badge: null,
    discount: true,
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    sub: 'All major Indian banks supported',
    icon: 'fa-university',
    badge: null,
    discount: true,
  },
  {
    id: 'wallet',
    label: 'Wallets',
    sub: 'Paytm, Amazon Pay, Mobikwik & more',
    icon: 'fa-wallet',
    badge: null,
    discount: true,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    sub: '+₹49 COD handling fee',
    icon: 'fa-money-bill-wave',
    badge: null,
    discount: false,
  },
]

// UPI app icons
const UPI_APPS = [
  { name: 'GPay', color: '#4285F4', icon: 'G' },
  { name: 'PhonePe', color: '#5f259f', icon: 'P' },
  { name: 'Paytm', color: '#00BAF2', icon: 'T' },
  { name: 'BHIM', color: '#00529B', icon: 'B' },
]

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [rzpLoaded, setRzpLoaded] = useState(false)

  const [address, setAddress] = useState({
    name:  (user?.firstName || '') + ' ' + (user?.lastName || ''),
    phone: user?.phone || '',
    line1: '', line2: '', city: '', state: '', pin: ''
  })

  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [upiError, setUpiError] = useState('')

  const [coupon, setCoupon] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')

  // Pricing
  const isOnline = paymentMethod !== 'cod'
  const shipping = cartTotal >= 999 ? 0 : 99
  const codFee = paymentMethod === 'cod' ? 49 : 0
  const prepaidDiscount = isOnline ? Math.round(cartTotal * 0.05) : 0
  const total = cartTotal - discount - prepaidDiscount + shipping + codFee

  // Load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript().then(ok => setRzpLoaded(ok))
  }, [])

  // ── Coupon ──
  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    try {
      const { data } = await api.post('/coupons/validate', {
        code: coupon.trim(),
        orderValue: cartTotal,
        userId: user?._id
      })
      setDiscount(data.discount)
      setCouponApplied(coupon.toUpperCase().trim())
      toast.success(`Coupon applied! Saved ${fmt(data.discount)} 🎉`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code')
    }
    setCouponLoading(false)
  }

  const removeCoupon = () => { setDiscount(0); setCouponApplied(''); setCoupon('') }

  // ── Address validation ──
  const validateAddress = () => {
    if (!address.name.trim()) { toast.error('Full name is required'); return false }
    if (!address.phone.trim() || address.phone.length < 10) { toast.error('Valid phone number required'); return false }
    if (!address.line1.trim()) { toast.error('Address line 1 is required'); return false }
    if (!address.city.trim()) { toast.error('City is required'); return false }
    if (!address.state.trim()) { toast.error('State is required'); return false }
    if (!address.pin.trim() || address.pin.length !== 6) { toast.error('Valid 6-digit PIN code required'); return false }
    return true
  }

  // ── Place order (COD) ──
  const placeOrderCOD = async () => {
    if (!isLoggedIn()) { navigate('/login'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/orders', buildOrderPayload({ paymentMethod: 'cod' }))
      if (data.success) {
        clearCart()
        toast.success('Order placed! 🎉 Pay on delivery.')
        navigate('/account')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    }
    setLoading(false)
  }

  // ── Place order (Razorpay — UPI / Card / Netbanking / Wallet) ──
  const placeOrderRazorpay = async () => {
    if (!isLoggedIn()) { navigate('/login'); return }
    setLoading(true)

    try {
      // 1. Create Razorpay order on backend
      const { data: rzpData } = await api.post('/payment/create-order', {
        amount: total,
        currency: 'INR',
        notes: { userEmail: user.email }
      })

      // 2. Demo mode — skip Razorpay UI
      if (rzpData.demo) {
        const { data } = await api.post('/orders', buildOrderPayload({
          paymentMethod: 'demo',
          paymentId: 'DEMO_' + Date.now(),
          razorpayOrderId: rzpData.order.id
        }))
        if (data.success) {
          clearCart()
          toast.success('Demo order placed! 🎉')
          navigate('/account')
        }
        setLoading(false)
        return
      }

      // 3. Open Razorpay checkout with selected method
      const rzpResponse = await openRazorpayCheckout({
        key:            rzpData.key,
        order:          rzpData.order,
        amount:         total,
        name:           'EverThread',
        description:    `Order — ${cart.length} item(s)`,
        prefill:        { name: address.name, email: user.email, phone: address.phone },
        theme:          { color: '#e63946' },
        selectedMethod: paymentMethod, // 'upi' | 'card' | 'netbanking' | 'wallet'
      })

      // 4. Verify signature on backend
      const { data: verifyData } = await api.post('/payment/verify', rzpResponse)
      if (!verifyData.verified) throw new Error('Payment verification failed')

      // 5. Create order in DB
      const { data: orderData } = await api.post('/orders', buildOrderPayload({
        paymentMethod: 'razorpay',
        paymentId:       rzpResponse.razorpay_payment_id,
        razorpayOrderId: rzpResponse.razorpay_order_id,
      }))

      if (orderData.success) {
        clearCart()
        toast.success('Payment successful! Order placed 🎉')
        navigate('/account')
      }
    } catch (err) {
      if (err.message === 'Payment cancelled by user') {
        toast('Payment cancelled')
      } else {
        toast.error(err.response?.data?.message || err.message || 'Payment failed')
      }
    }
    setLoading(false)
  }

  const buildOrderPayload = ({ paymentMethod: pm, paymentId, razorpayOrderId }) => ({
    items: cart.map(i => ({
      productId: i.productId, name: i.name, img: i.img,
      price: i.price, size: i.size, qty: i.qty, category: i.category
    })),
    address,
    subtotal: cartTotal,
    discount: discount + prepaidDiscount,
    couponCode: couponApplied || undefined,
    shipping,
    codFee,
    total,
    paymentMethod: pm,
    paymentId,
    razorpayOrderId,
  })

  const handlePlaceOrder = () => {
    if (paymentMethod === 'cod') placeOrderCOD()
    else placeOrderRazorpay()
  }

  if (cart.length === 0) return (
    <div className="checkout-page">
      <div className="container" style={{ textAlign:'center', padding:'80px 20px' }}>
        <i className="fa fa-shopping-bag" style={{ fontSize:56, color:'#ddd', display:'block', marginBottom:20 }} />
        <h2 style={{ fontFamily:'var(--font-heading)', marginBottom:12 }}>Your cart is empty</h2>
        <Link to="/shop" className="btn-primary" style={{ display:'inline-flex', marginTop:8 }}>Shop Now</Link>
      </div>
    </div>
  )

  return (
    <div className="checkout-page">
      <div className="container">

        {/* Header */}
        <div className="checkout-header">
          <Logo size="md" />
          <div className="checkout-steps">
            {['Address','Payment','Review'].map((s, i) => (
              <div key={s} className={`step${step > i+1 ? ' done' : step === i+1 ? ' active' : ''}`}>
                <span className="step-num">{step > i+1 ? '✓' : i+1}</span>
                <span>{s}</span>
                {i < 2 && <span style={{ color:'#ddd', margin:'0 4px' }}>›</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* ── STEP 1: ADDRESS ── */}
            {step === 1 && (
              <div className="checkout-section">
                <h2>Delivery Address</h2>

                {/* Saved addresses shortcut */}
                {user?.addresses?.length > 0 && (
                  <div className="saved-addresses">
                    <p className="saved-label">Saved addresses</p>
                    <div className="saved-list">
                      {user.addresses.map((a, i) => (
                        <div key={i} className="saved-addr-card" onClick={() => setAddress({ name: a.name || address.name, phone: a.phone || address.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pin: a.pin })}>
                          <div className="saved-addr-label">{a.label || 'Address'} {a.isDefault && <span className="addr-default">Default</span>}</div>
                          <div className="saved-addr-text">{a.line1}, {a.city}, {a.state} - {a.pin}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="address-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} placeholder="Rahul Sharma" />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="+91 98765 43210" maxLength={13} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Address Line 1 *</label>
                    <input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} placeholder="House/Flat No., Building, Street" />
                  </div>
                  <div className="form-group">
                    <label>Address Line 2 <span style={{ color:'var(--gray)', fontWeight:400 }}>(optional)</span></label>
                    <input value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} placeholder="Area, Landmark" />
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>City *</label>
                      <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Mumbai" />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="Maharashtra" />
                    </div>
                    <div className="form-group">
                      <label>PIN Code *</label>
                      <input value={address.pin} onChange={e => setAddress(a => ({ ...a, pin: e.target.value.replace(/\D/g,'') }))} placeholder="400001" maxLength={6} />
                    </div>
                  </div>
                  <button className="btn-primary" style={{ alignSelf:'flex-start' }} onClick={() => { if (validateAddress()) setStep(2) }}>
                    Continue to Payment <i className="fa fa-arrow-right" style={{ marginLeft:8 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: PAYMENT ── */}
            {step === 2 && (
              <div className="checkout-section">
                <h2>Payment Method</h2>

                {/* Prepaid savings banner */}
                <div className="prepaid-banner">
                  <i className="fa fa-tag" />
                  <span>Save <strong>{fmt(Math.round(cartTotal * 0.05))}</strong> extra with online payment (5% prepaid discount)</span>
                </div>

                {/* Payment options */}
                <div className="payment-options">
                  {PAYMENT_METHODS.map(opt => (
                    <label key={opt.id} className={`payment-option${paymentMethod === opt.id ? ' active' : ''}`} onClick={() => setPaymentMethod(opt.id)}>
                      <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} />
                      <div className="payment-option-icon">
                        <i className={`fa ${opt.icon}`} />
                      </div>
                      <div className="payment-option-body">
                        <div className="payment-option-title">
                          {opt.label}
                          {opt.badge && <span className="payment-badge" style={{ background: opt.badgeColor + '20', color: opt.badgeColor }}>{opt.badge}</span>}
                          {opt.discount && <span className="payment-badge" style={{ background:'#dcfce7', color:'#166534' }}>5% OFF</span>}
                        </div>
                        <div className="payment-option-sub">{opt.sub}</div>

                        {/* UPI app icons */}
                        {opt.id === 'upi' && paymentMethod === 'upi' && (
                          <div className="upi-apps">
                            {UPI_APPS.map(app => (
                              <div key={app.name} className="upi-app-chip" style={{ borderColor: app.color + '40' }}>
                                <span className="upi-app-icon" style={{ background: app.color, color:'#fff' }}>{app.icon}</span>
                                <span>{app.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Card logos */}
                        {opt.id === 'card' && paymentMethod === 'card' && (
                          <div className="card-logos">
                            <i className="fab fa-cc-visa" style={{ fontSize:24, color:'#1a1f71' }} />
                            <i className="fab fa-cc-mastercard" style={{ fontSize:24, color:'#eb001b' }} />
                            <i className="fab fa-cc-amex" style={{ fontSize:24, color:'#007bc1' }} />
                            <span style={{ fontSize:11, color:'var(--gray)', marginLeft:4 }}>RuPay & more</span>
                          </div>
                        )}
                      </div>
                      <div className="payment-option-check">
                        {paymentMethod === opt.id && <i className="fa fa-check-circle" style={{ color:'var(--black)', fontSize:18 }} />}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Coupon */}
                <div className="coupon-section">
                  <div className="coupon-label"><i className="fa fa-tag" /> Apply Coupon</div>
                  {couponApplied ? (
                    <div className="coupon-applied-row">
                      <div className="coupon-applied-info">
                        <i className="fa fa-check-circle" style={{ color:'#166534' }} />
                        <span><strong>{couponApplied}</strong> applied — you save {fmt(discount)}</span>
                      </div>
                      <button className="coupon-remove" onClick={removeCoupon}>Remove</button>
                    </div>
                  ) : (
                    <div className="coupon-row">
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. WELCOME15)"
                        value={coupon}
                        onChange={e => setCoupon(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        style={{ textTransform:'uppercase' }}
                      />
                      <button className="btn-apply" onClick={applyCoupon} disabled={couponLoading}>
                        {couponLoading ? <i className="fa fa-spinner fa-spin" /> : 'Apply'}
                      </button>
                    </div>
                  )}
                  <div className="coupon-hints">
                    Try: <span onClick={() => setCoupon('WELCOME15')}>WELCOME15</span> · <span onClick={() => setCoupon('SUMMER20')}>SUMMER20</span> · <span onClick={() => setCoupon('FLAT10')}>FLAT10</span>
                  </div>
                </div>

                <div className="step-btns">
                  <button className="btn-back" onClick={() => setStep(1)}><i className="fa fa-arrow-left" /> Back</button>
                  <button className="btn-primary" onClick={() => setStep(3)}>
                    Review Order <i className="fa fa-arrow-right" style={{ marginLeft:8 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: REVIEW ── */}
            {step === 3 && (
              <div className="checkout-section">
                <h2>Review & Place Order</h2>

                {/* Items */}
                <div className="review-items">
                  {cart.map(item => (
                    <div key={`${item.productId}-${item.size}`} className="review-item">
                      <div className="review-item-img">
                        {item.img ? <img src={item.img} alt={item.name} /> : <i className="fa fa-tshirt" />}
                      </div>
                      <div className="review-item-info">
                        <h4>{item.name}</h4>
                        <p>Size: {item.size} · Qty: {item.qty}</p>
                      </div>
                      <span style={{ fontWeight:700 }}>{fmt(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Address summary */}
                <div className="review-block">
                  <div className="review-block-header">
                    <i className="fa fa-map-marker-alt" /> Delivering to
                    <button className="review-edit" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <p><strong>{address.name}</strong> · {address.phone}</p>
                  <p>{address.line1}{address.line2 ? ', ' + address.line2 : ''}, {address.city}, {address.state} — {address.pin}</p>
                </div>

                {/* Payment summary */}
                <div className="review-block">
                  <div className="review-block-header">
                    <i className="fa fa-credit-card" /> Payment
                    <button className="review-edit" onClick={() => setStep(2)}>Edit</button>
                  </div>
                  <p>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                  {isOnline && !rzpLoaded && (
                    <p style={{ color:'#92400e', fontSize:12, marginTop:4 }}>
                      <i className="fa fa-exclamation-triangle" /> Loading payment gateway...
                    </p>
                  )}
                </div>

                {/* Place order button */}
                <div className="place-order-section">
                  <button
                    className="btn-place-order"
                    onClick={handlePlaceOrder}
                    disabled={loading || (isOnline && !rzpLoaded)}
                  >
                    {loading ? (
                      <><i className="fa fa-spinner fa-spin" /> Processing...</>
                    ) : paymentMethod === 'cod' ? (
                      <><i className="fa fa-check" /> Place Order · {fmt(total)}</>
                    ) : (
                      <><i className="fa fa-lock" /> Pay {fmt(total)} Securely</>
                    )}
                  </button>
                  <div className="secure-badges">
                    <span><i className="fa fa-shield-alt" /> 100% Secure</span>
                    <span><i className="fa fa-lock" /> SSL Encrypted</span>
                    <span><i className="fa fa-undo" /> 7-Day Returns</span>
                  </div>
                  {isOnline && (
                    <div className="rzp-powered">
                      <span>Powered by</span>
                      <strong style={{ color:'#072654' }}>Razorpay</strong>
                      <span>· UPI · Cards · Netbanking · Wallets</span>
                    </div>
                  )}
                </div>

                <button className="btn-back" onClick={() => setStep(2)} style={{ marginTop:8 }}>
                  <i className="fa fa-arrow-left" /> Back to Payment
                </button>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="checkout-sidebar">
            <h3>Order Summary</h3>

            <div className="sidebar-items">
              {cart.map(item => (
                <div key={`${item.productId}-${item.size}`} className="sidebar-item">
                  <div className="sidebar-item-img">
                    {item.img ? <img src={item.img} alt={item.name} /> : <i className="fa fa-tshirt" />}
                    <span className="sidebar-item-qty">{item.qty}</span>
                  </div>
                  <div className="sidebar-item-info">
                    <div className="sidebar-item-name">{item.name}</div>
                    <div className="sidebar-item-size">Size: {item.size}</div>
                  </div>
                  <span className="sidebar-item-price">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-row"><span>Subtotal ({cart.reduce((s,i)=>s+i.qty,0)} items)</span><span>{fmt(cartTotal)}</span></div>
            {discount > 0 && <div className="sidebar-row green"><span>Coupon ({couponApplied})</span><span>−{fmt(discount)}</span></div>}
            {prepaidDiscount > 0 && <div className="sidebar-row green"><span>Prepaid Discount (5%)</span><span>−{fmt(prepaidDiscount)}</span></div>}
            <div className="sidebar-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="free-ship">FREE</span> : fmt(shipping)}</span>
            </div>
            {codFee > 0 && <div className="sidebar-row"><span>COD Fee</span><span>{fmt(codFee)}</span></div>}

            <div className="sidebar-divider" />
            <div className="sidebar-row total"><span>Total</span><span>{fmt(total)}</span></div>

            {shipping > 0 && (
              <div className="free-ship-progress">
                <div className="free-ship-bar">
                  <div className="free-ship-fill" style={{ width: Math.min(100, (cartTotal / 999) * 100) + '%' }} />
                </div>
                <p>Add {fmt(999 - cartTotal)} more for <strong>FREE shipping</strong></p>
              </div>
            )}

            <div className="sidebar-trust">
              <div className="trust-item"><i className="fa fa-shield-alt" /><span>Secure Checkout</span></div>
              <div className="trust-item"><i className="fa fa-undo" /><span>Easy Returns</span></div>
              <div className="trust-item"><i className="fa fa-truck" /><span>Fast Delivery</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
