import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { fmt, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import './Account.css'

const STATUS_COLORS = {
  pending:'#92400e', confirmed:'#1d4ed8', processing:'#92400e',
  packed:'#4c1d95', shipped:'#0e7490', out_for_delivery:'#92400e',
  delivered:'#166534', cancelled:'#991b1b', returned:'#374151'
}

const TABS = [
  { id:'orders',   icon:'fa-box',          label:'My Orders' },
  { id:'returns',  icon:'fa-undo',         label:'Returns' },
  { id:'profile',  icon:'fa-user',         label:'Profile' },
  { id:'address',  icon:'fa-map-marker-alt', label:'Addresses' },
  { id:'password', icon:'fa-lock',         label:'Password' },
  { id:'wishlist', icon:'fa-heart',        label:'Wishlist' },
]

export default function Account() {
  const { user, logout, updateUser, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Profile form
  const [profile, setProfile] = useState({ firstName:'', lastName:'', phone:'' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [savingPw, setSavingPw] = useState(false)

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [addrForm, setAddrForm] = useState({ label:'Home', name:'', phone:'', line1:'', line2:'', city:'', state:'', pin:'', isDefault:false })
  const [savingAddr, setSavingAddr] = useState(false)
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' })
    setAddresses(user.addresses || [])
    fetchOrders()
    fetchReturns()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/orders/myorders')
      setOrders(data.orders || [])
    } catch { setOrders([]) }
    setLoading(false)
  }

  const fetchReturns = async () => {
    try {
      const { data } = await api.get('/returns/mine')
      setReturns(data.returns || [])
    } catch { setReturns([]) }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.put('/auth/updateprofile', profile)
      if (data.success) { updateUser(data.user); toast.success('Profile updated ✅') }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    setSavingProfile(false)
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSavingPw(true)
    try {
      const { data } = await api.put('/auth/changepassword', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      if (data.success) { toast.success('Password changed ✅'); setPwForm({ currentPassword:'', newPassword:'', confirm:'' }) }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password') }
    setSavingPw(false)
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setSavingAddr(true)
    try {
      const { data } = await api.post('/auth/address', addrForm)
      if (data.success) {
        setAddresses(data.addresses)
        const u = { ...user, addresses: data.addresses }
        updateUser(u)
        toast.success('Address saved ✅')
        setShowAddrForm(false)
        setAddrForm({ label:'Home', name:'', phone:'', line1:'', line2:'', city:'', state:'', pin:'', isDefault:false })
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save address') }
    setSavingAddr(false)
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return
    try {
      const { data } = await api.delete(`/auth/address/${id}`)
      if (data.success) {
        setAddresses(data.addresses)
        updateUser({ ...user, addresses: data.addresses })
        toast.success('Address deleted')
      }
    } catch { toast.error('Failed to delete address') }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return
    try {
      const { data } = await api.put(`/orders/${orderId}/cancel`)
      if (data.success) { toast.success('Order cancelled'); fetchOrders() }
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel order') }
  }

  const setA = k => e => setAddrForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="account-page">
      <div className="container">
        {/* Header */}
        <div className="account-header">
          <div>
            <h1>My Account</h1>
            <p>Welcome back, <strong>{user?.firstName}</strong>! 👋</p>
          </div>
          <button className="btn-outline-dark" onClick={() => { logout(); navigate('/') }}>
            <i className="fa fa-sign-out-alt" /> Sign Out
          </button>
        </div>

        <div className="account-layout">
          {/* Sidebar */}
          <aside className="account-sidebar">
            {TABS.map(t => (
              <button key={t.id} className={`sidebar-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                <i className={`fa ${t.icon}`} /> {t.label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="account-content">

            {/* ── ORDERS ── */}
            {tab === 'orders' && (
              <div>
                <h2>My Orders</h2>
                {loading ? (
                  <div style={{ textAlign:'center', padding:40 }}><i className="fa fa-spinner fa-spin" style={{ fontSize:24, color:'#ddd' }} /></div>
                ) : orders.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-box-open" />
                    <p>No orders yet</p>
                    <Link to="/shop" className="btn-primary">Start Shopping</Link>
                  </div>
                ) : selectedOrder ? (
                  /* Order Detail */
                  <div>
                    <button className="btn-back-link" onClick={() => setSelectedOrder(null)}>
                      <i className="fa fa-arrow-left" /> Back to Orders
                    </button>
                    <div className="order-detail-card">
                      <div className="order-detail-header">
                        <div>
                          <div className="order-id-lg">#{selectedOrder.orderId}</div>
                          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{fmtDate(selectedOrder.createdAt)}</div>
                        </div>
                        <span className="order-status-badge" style={{ background: STATUS_COLORS[selectedOrder.status]+'18', color: STATUS_COLORS[selectedOrder.status], fontSize:13, padding:'6px 14px' }}>
                          {selectedOrder.status?.replace(/_/g,' ')}
                        </span>
                      </div>

                      {/* Tracking timeline */}
                      {selectedOrder.tracking?.length > 0 && (
                        <div className="order-tracking">
                          <h4>Tracking</h4>
                          <div className="tracking-timeline">
                            {[...selectedOrder.tracking].reverse().map((t, i) => (
                              <div key={i} className="tracking-step">
                                <div className="tracking-dot-sm" />
                                <div>
                                  <div className="tracking-status">{t.status?.replace(/_/g,' ')}</div>
                                  <div className="tracking-msg">{t.message} {t.location && `· ${t.location}`}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div className="order-items-detail">
                        <h4>Items ({selectedOrder.items?.length})</h4>
                        {selectedOrder.items?.map((item, i) => (
                          <div key={i} className="order-item-row-acc">
                            <div className="order-item-img-acc">
                              {item.img ? <img src={item.img} alt={item.name} /> : <i className="fa fa-tshirt" />}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:600, fontSize:14 }}>{item.name}</div>
                              <div style={{ fontSize:12, color:'#64748b' }}>Size: {item.size} · Qty: {item.qty}</div>
                            </div>
                            <div style={{ fontWeight:700 }}>{fmt(item.price * item.qty)}</div>
                          </div>
                        ))}
                      </div>

                      {/* Price breakdown */}
                      <div className="order-price-breakdown">
                        <div className="price-row"><span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span></div>
                        {selectedOrder.discount > 0 && <div className="price-row green"><span>Discount</span><span>−{fmt(selectedOrder.discount)}</span></div>}
                        <div className="price-row"><span>Shipping</span><span>{selectedOrder.shipping === 0 ? 'FREE' : fmt(selectedOrder.shipping)}</span></div>
                        {selectedOrder.codFee > 0 && <div className="price-row"><span>COD Fee</span><span>{fmt(selectedOrder.codFee)}</span></div>}
                        <div className="price-row total"><span>Total</span><span>{fmt(selectedOrder.total)}</span></div>
                      </div>

                      {/* Delivery address */}
                      <div className="order-address-block">
                        <h4>Delivering to</h4>
                        <p>{selectedOrder.address?.name} · {selectedOrder.address?.phone}</p>
                        <p>{selectedOrder.address?.line1}{selectedOrder.address?.line2 ? ', '+selectedOrder.address.line2 : ''}, {selectedOrder.address?.city}, {selectedOrder.address?.state} — {selectedOrder.address?.pin}</p>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
                        {['pending','confirmed','processing'].includes(selectedOrder.status) && (
                          <button className="btn-outline-dark" onClick={() => handleCancelOrder(selectedOrder.orderId)}>
                            <i className="fa fa-times" /> Cancel Order
                          </button>
                        )}
                        {selectedOrder.status === 'delivered' && (
                          <button className="btn-outline-dark" onClick={() => { setTab('returns') }}>
                            <i className="fa fa-undo" /> Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(o => (
                      <div key={o._id} className="order-card" onClick={() => setSelectedOrder(o)} style={{ cursor:'pointer' }}>
                        <div className="order-card-header">
                          <div>
                            <span className="order-id">#{o.orderId}</span>
                            <span className="order-date">{fmtDate(o.createdAt)}</span>
                          </div>
                          <span className="order-status-badge" style={{ background: STATUS_COLORS[o.status]+'18', color: STATUS_COLORS[o.status] }}>
                            {o.status?.replace(/_/g,' ')}
                          </span>
                        </div>
                        <div className="order-items-preview">
                          {o.items?.slice(0,3).map((item, i) => (
                            <div key={i} className="order-item-mini">
                              {item.img ? <img src={item.img} alt={item.name} /> : <div className="order-item-placeholder"><i className="fa fa-tshirt" /></div>}
                            </div>
                          ))}
                          {o.items?.length > 3 && <span className="more-items">+{o.items.length - 3} more</span>}
                        </div>
                        <div className="order-card-footer">
                          <span>{o.items?.length} item(s) · <strong>{fmt(o.total)}</strong></span>
                          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span className="payment-method">{o.paymentMethod?.toUpperCase()}</span>
                            <span style={{ fontSize:12, color:'#94a3b8' }}>View details →</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── RETURNS ── */}
            {tab === 'returns' && (
              <div>
                <h2>My Returns</h2>
                {returns.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-undo" />
                    <p>No return requests yet</p>
                    <p style={{ fontSize:13, color:'#64748b' }}>You can request a return from a delivered order</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {returns.map(r => (
                      <div key={r._id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-id">#{r.returnId}</span>
                            <span className="order-date">Order: {r.orderId}</span>
                          </div>
                          <span className="order-status-badge" style={{ background:'#fef3c7', color:'#92400e' }}>
                            {r.status?.replace(/_/g,' ')}
                          </span>
                        </div>
                        <div className="order-card-footer">
                          <span>Refund: <strong>{fmt(r.refundAmount)}</strong> · {r.reason}</span>
                          <span style={{ fontSize:12, color:'#64748b' }}>{fmtDate(r.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE ── */}
            {tab === 'profile' && (
              <div>
                <h2>Profile Settings</h2>
                <form onSubmit={handleProfileSave} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none' }}>(cannot be changed)</span></label>
                    <input value={user?.email} disabled style={{ opacity:0.6, background:'#f8fafc' }} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                  <button type="submit" className="btn-primary" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {tab === 'address' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <h2>Saved Addresses</h2>
                  <button className="btn-primary" style={{ padding:'10px 20px', fontSize:12 }} onClick={() => setShowAddrForm(s => !s)}>
                    <i className="fa fa-plus" /> Add Address
                  </button>
                </div>

                {showAddrForm && (
                  <form onSubmit={handleAddAddress} className="profile-form" style={{ marginBottom:24, padding:20, border:'1px solid var(--border-color)', background:'#fafafa' }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>New Address</div>
                    <div className="form-row">
                      <div className="form-group"><label>Label</label>
                        <select value={addrForm.label} onChange={setA('label')}>
                          {['Home','Work','Other'].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="form-group"><label>Full Name</label><input value={addrForm.name} onChange={setA('name')} required /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Phone</label><input value={addrForm.phone} onChange={setA('phone')} required /></div>
                      <div className="form-group"><label>PIN Code</label><input value={addrForm.pin} onChange={setA('pin')} required maxLength={6} /></div>
                    </div>
                    <div className="form-group"><label>Address Line 1</label><input value={addrForm.line1} onChange={setA('line1')} required placeholder="House/Flat, Street" /></div>
                    <div className="form-group"><label>Address Line 2 (optional)</label><input value={addrForm.line2} onChange={setA('line2')} placeholder="Area, Landmark" /></div>
                    <div className="form-row">
                      <div className="form-group"><label>City</label><input value={addrForm.city} onChange={setA('city')} required /></div>
                      <div className="form-group"><label>State</label><input value={addrForm.state} onChange={setA('state')} required /></div>
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox" checked={addrForm.isDefault} onChange={setA('isDefault')} />
                      Set as default address
                    </label>
                    <div style={{ display:'flex', gap:10 }}>
                      <button type="submit" className="btn-primary" disabled={savingAddr}>{savingAddr ? 'Saving...' : 'Save Address'}</button>
                      <button type="button" className="btn-outline-dark" onClick={() => setShowAddrForm(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <div className="empty-state"><i className="fa fa-map-marker-alt" /><p>No saved addresses</p></div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {addresses.map((a, i) => (
                      <div key={a._id || i} className="address-card">
                        <div className="address-card-header">
                          <span className="address-label">{a.label || 'Address'}</span>
                          {a.isDefault && <span className="address-default">Default</span>}
                        </div>
                        <div className="address-body">
                          <strong>{a.name}</strong><br />
                          {a.phone}<br />
                          {a.line1}{a.line2 ? ', '+a.line2 : ''}<br />
                          {a.city}, {a.state} — {a.pin}
                        </div>
                        <button className="address-delete" onClick={() => handleDeleteAddress(a._id)}>
                          <i className="fa fa-trash" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PASSWORD ── */}
            {tab === 'password' && (
              <div>
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordSave} className="profile-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required placeholder="Min 6 characters" minLength={6} />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required placeholder="Repeat new password" />
                  </div>
                  <button type="submit" className="btn-primary" disabled={savingPw}>
                    {savingPw ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* ── WISHLIST ── */}
            {tab === 'wishlist' && (
              <div>
                <h2>My Wishlist</h2>
                <div className="empty-state">
                  <i className="fa fa-heart" />
                  <p>View and manage your saved items</p>
                  <Link to="/wishlist" className="btn-primary">Go to Wishlist</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
