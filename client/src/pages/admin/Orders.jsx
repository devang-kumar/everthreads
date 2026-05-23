import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmt, fmtDate, fmtTime } from '../../utils/format'
import toast from 'react-hot-toast'

const STATUSES = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [updating, setUpdating] = useState(false)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/admin/orders?${params}`)
      let list = data.orders || []
      if (payFilter) list = list.filter(o => o.paymentMethod === payFilter)
      setOrders(list)
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load orders') }
    setLoading(false)
  }, [page, search, statusFilter, payFilter])

  useEffect(() => { load() }, [load])

  const viewOrder = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`)
      setSelectedOrder(data.order)
      setNewStatus(data.order.status)
      setStatusMsg('')
    } catch { toast.error('Failed to load order') }
  }

  const updateStatus = async () => {
    if (!selectedOrder) return
    setUpdating(true)
    try {
      await api.put(`/admin/orders/${selectedOrder.orderId}/status`, { status: newStatus, message: statusMsg })
      toast.success('Order status updated ✅')
      setSelectedOrder(null)
      load()
    } catch { toast.error('Update failed') }
    setUpdating(false)
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Orders</h1><p>{total} total orders</p></div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search by order ID or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select className="admin-select" value={payFilter} onChange={e => setPayFilter(e.target.value)}>
            <option value="">All Payments</option>
            <option value="cod">COD</option>
            <option value="razorpay">Razorpay</option>
            <option value="demo">Demo</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-cell"><i className="fa fa-spinner fa-spin" /> Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No orders found</td></tr>
              ) : orders.map(o => (
                <tr key={o._id}>
                  <td><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.orderId}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.user ? o.user.firstName + ' ' + o.user.lastName : '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{o.userEmail}</div>
                  </td>
                  <td>{o.items?.length || 0}</td>
                  <td><strong>{fmt(o.total)}</strong></td>
                  <td><span className="badge" style={{ background: o.paymentMethod === 'cod' ? '#fef3c7' : '#dbeafe', color: o.paymentMethod === 'cod' ? '#92400e' : '#1e40af' }}>{o.paymentMethod?.toUpperCase()}</span></td>
                  <td><span className={`badge badge-${o.status}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: 12 }}>{fmtDate(o.createdAt)}</td>
                  <td><button className="btn-icon" onClick={() => viewOrder(o.orderId)} title="View"><i className="fa fa-eye" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="admin-pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><i className="fa fa-chevron-left" /></button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}><i className="fa fa-chevron-right" /></button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{selectedOrder.orderId}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="order-detail-grid">
                <div className="detail-block">
                  <h4>Customer</h4>
                  <p><strong>{selectedOrder.address?.name || '—'}</strong><br />{selectedOrder.userEmail}<br />{selectedOrder.address?.phone}</p>
                </div>
                <div className="detail-block">
                  <h4>Delivery Address</h4>
                  <p>{selectedOrder.address?.line1}<br />{selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pin}</p>
                </div>
                <div className="detail-block">
                  <h4>Payment</h4>
                  <p>Method: <strong>{selectedOrder.paymentMethod?.toUpperCase()}</strong><br />
                  {selectedOrder.paymentId && `ID: ${selectedOrder.paymentId}`}<br />
                  Total: <strong>{fmt(selectedOrder.total)}</strong><br />
                  {selectedOrder.couponCode && `Coupon: ${selectedOrder.couponCode}`}</p>
                </div>
                <div className="detail-block">
                  <h4>Timeline</h4>
                  <p>Placed: {fmtTime(selectedOrder.createdAt)}<br />
                  Est. Delivery: {selectedOrder.estimatedDelivery ? fmtDate(selectedOrder.estimatedDelivery) : 'N/A'}</p>
                </div>
              </div>

              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', margin: '16px 0 10px' }}>Items ({selectedOrder.items?.length})</h4>
              <div className="order-items-list">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="order-item-row">
                    {item.img ? <img src={item.img} className="order-item-img" alt={item.name} onError={e => e.target.style.display = 'none'} /> : <div className="order-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><i className="fa fa-tshirt" /></div>}
                    <div className="order-item-info"><h4>{item.name}</h4><p>Size: {item.size} · Qty: {item.qty} · {fmt(item.price)} each</p></div>
                    <div className="order-item-price">{fmt(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f8fafc', padding: 14, margin: '12px 0', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span></div>
                {selectedOrder.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#166534' }}><span>Discount</span><span>−{fmt(selectedOrder.discount)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Shipping</span><span>{selectedOrder.shipping === 0 ? 'FREE' : fmt(selectedOrder.shipping)}</span></div>
                {selectedOrder.codFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>COD Fee</span><span>{fmt(selectedOrder.codFee)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}><span>Total</span><span>{fmt(selectedOrder.total)}</span></div>
              </div>

              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>Update Status</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <select className="status-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="text" value={statusMsg} onChange={e => setStatusMsg(e.target.value)} placeholder="Status note (optional)" style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
              </div>

              {selectedOrder.tracking?.length > 0 && (
                <>
                  <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>Tracking History</h4>
                  <div className="tracking-list">
                    {[...selectedOrder.tracking].reverse().map((t, i) => (
                      <div key={i} className="tracking-item">
                        <div className="tracking-dot" />
                        <div className="tracking-info">
                          <strong>{t.status?.replace(/_/g, ' ')}</strong>
                          <span>{t.message} · {fmtTime(t.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setSelectedOrder(null)}>Close</button>
              <button className="btn-admin primary" onClick={updateStatus} disabled={updating}>
                {updating ? <><i className="fa fa-spinner fa-spin" /> Updating...</> : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
