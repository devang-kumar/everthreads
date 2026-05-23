import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmt, fmtDate, fmtTime } from '../../utils/format'
import toast from 'react-hot-toast'

const STATUSES = ['requested','approved','rejected','picked_up','received','refunded']

export default function AdminReturns() {
  const [returns, setReturns] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/admin/returns?${params}`)
      setReturns(data.returns || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load returns') }
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  const viewReturn = (r) => { setSelected(r); setNewStatus(r.status); setAdminNote('') }

  const updateStatus = async () => {
    setUpdating(true)
    try {
      await api.put(`/admin/returns/${selected._id}/status`, { status: newStatus, adminNote })
      toast.success('Return status updated ✅')
      setSelected(null); load()
    } catch { toast.error('Update failed') }
    setUpdating(false)
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  const STATUS_COLOR = { requested:'#92400e', approved:'#1d4ed8', rejected:'#991b1b', picked_up:'#4c1d95', received:'#0e7490', refunded:'#166534' }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Returns & Refunds</h1><p>{total} return requests</p></div>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1) }}
            style={{ padding:'6px 14px', fontSize:12, fontWeight:700, border:`2px solid ${statusFilter===s ? STATUS_COLOR[s] : '#e2e8f0'}`, background: statusFilter===s ? STATUS_COLOR[s]+'18' : '#fff', color: STATUS_COLOR[s], cursor:'pointer', transition:'all .2s' }}>
            {s.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search by return ID, order ID or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Return ID</th><th>Order ID</th><th>Customer</th><th>Items</th><th>Refund Amt</th><th>Reason</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="empty-cell"><i className="fa fa-spinner fa-spin" /></td></tr>
              : returns.length === 0 ? <tr><td colSpan={9} className="empty-cell">No returns found</td></tr>
              : returns.map(r => (
                <tr key={r._id}>
                  <td><strong style={{ fontFamily:'monospace', fontSize:12 }}>{r.returnId}</strong></td>
                  <td style={{ fontFamily:'monospace', fontSize:12 }}>{r.orderId}</td>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.user ? `${r.user.firstName} ${r.user.lastName}` : '—'}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{r.userEmail}</div>
                  </td>
                  <td>{r.items?.length || 0}</td>
                  <td><strong>{fmt(r.refundAmount)}</strong></td>
                  <td style={{ fontSize:12, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reason}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status?.replace(/_/g,' ')}</span></td>
                  <td style={{ fontSize:12 }}>{fmtDate(r.createdAt)}</td>
                  <td><button className="btn-icon" onClick={() => viewReturn(r)} title="View"><i className="fa fa-eye" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="admin-pagination">
            <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}><i className="fa fa-chevron-left" /></button>
            {Array.from({length:Math.min(pages,7)},(_,i)=>i+1).map(p=>(
              <button key={p} className={`page-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(p=>p+1)}><i className="fa fa-chevron-right" /></button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Return #{selected.returnId}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="order-detail-grid">
                <div className="detail-block"><h4>Customer</h4><p><strong>{selected.userEmail}</strong></p></div>
                <div className="detail-block"><h4>Order</h4><p><strong>{selected.orderId}</strong></p></div>
                <div className="detail-block"><h4>Refund Amount</h4><p><strong style={{ fontSize:18, color:'var(--accent)' }}>{fmt(selected.refundAmount)}</strong><br />Method: {selected.refundMethod}</p></div>
                <div className="detail-block"><h4>Reason</h4><p>{selected.reason}<br /><span style={{ color:'#64748b', fontSize:12 }}>{selected.description}</span></p></div>
              </div>

              <h4 style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#64748b', margin:'16px 0 10px' }}>Items ({selected.items?.length})</h4>
              <div className="order-items-list">
                {selected.items?.map((item,i) => (
                  <div key={i} className="order-item-row">
                    {item.img ? <img src={item.img} className="order-item-img" alt={item.name} onError={e=>e.target.style.display='none'} /> : <div className="order-item-img" style={{ display:'flex',alignItems:'center',justifyContent:'center',color:'#ccc' }}><i className="fa fa-tshirt" /></div>}
                    <div className="order-item-info"><h4>{item.name}</h4><p>Size: {item.size} · Qty: {item.qty} · {fmt(item.price)} each</p><p style={{ color:'#64748b', fontSize:12 }}>Reason: {item.reason}</p></div>
                    <div className="order-item-price">{fmt(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div className="form-group"><label>Update Status</label>
                  <select className="status-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Admin Note</label>
                  <input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Note to customer..." style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', fontSize:13, outline:'none' }} />
                </div>
              </div>

              {selected.timeline?.length > 0 && (
                <>
                  <h4 style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#64748b', marginBottom:10 }}>Timeline</h4>
                  <div className="tracking-list">
                    {[...selected.timeline].reverse().map((t,i) => (
                      <div key={i} className="tracking-item">
                        <div className="tracking-dot" />
                        <div className="tracking-info">
                          <strong>{t.status?.replace(/_/g,' ')}</strong>
                          <span>{t.message} · {fmtTime(t.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setSelected(null)}>Close</button>
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
