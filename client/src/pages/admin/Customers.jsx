import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmt, fmtDate } from '../../utils/format'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (search) params.set('search', search)
      if (statusFilter) params.set('isActive', statusFilter)
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load customers') }
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  const viewCustomer = async (u) => {
    setSelected(u)
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/admin/users/${u._id}`)
      setDetail(data)
    } catch { setDetail(null) }
    setDetailLoading(false)
  }

  const toggleUser = async (u) => {
    if (!window.confirm(`${u.isActive ? 'Block' : 'Unblock'} "${u.firstName} ${u.lastName}"?`)) return
    try {
      await api.put(`/admin/users/${u._id}/toggle`)
      toast.success(`User ${u.isActive ? 'blocked' : 'unblocked'}`)
      load()
      if (selected?._id === u._id) setSelected(s => ({ ...s, isActive: !s.isActive }))
    } catch { toast.error('Failed to update user') }
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Customers</h1><p>{total} registered customers</p></div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search by name, email or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Customers</option>
            <option value="true">Active</option>
            <option value="false">Blocked</option>
          </select>
          <span style={{ fontSize:13, color:'#64748b', marginLeft:'auto' }}>{total} customers</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Joined</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="empty-cell"><i className="fa fa-spinner fa-spin" /></td></tr>
              : users.length === 0 ? <tr><td colSpan={7} className="empty-cell">No customers found</td></tr>
              : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'#0f172a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{u.firstName} {u.lastName}</div>
                        {u.gender && <div style={{ fontSize:11, color:'#94a3b8', textTransform:'capitalize' }}>{u.gender}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{u.email}</td>
                  <td style={{ fontSize:13 }}>{u.phone || '—'}</td>
                  <td style={{ fontSize:12 }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ fontSize:12 }}>{u.lastLogin ? fmtDate(u.lastLogin) : '—'}</td>
                  <td><span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Blocked'}</span></td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => viewCustomer(u)} title="View Details"><i className="fa fa-eye" /></button>
                      <button className={`btn-icon${u.isActive ? ' danger' : ' success'}`} onClick={() => toggleUser(u)} title={u.isActive ? 'Block' : 'Unblock'}>
                        <i className={`fa fa-${u.isActive ? 'ban' : 'check'}`} />
                      </button>
                    </div>
                  </td>
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

      {/* Customer Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Profile</h2>
              <button className="modal-close" onClick={() => setSelected(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              {/* Header */}
              <div className="customer-detail-header">
                <div className="customer-avatar-lg">{selected.firstName?.[0]}{selected.lastName?.[0]}</div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{selected.firstName} {selected.lastName}</h3>
                  <div style={{ fontSize:13, color:'#64748b', marginBottom:4 }}>{selected.email} {selected.phone && `· ${selected.phone}`}</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span className={`badge badge-${selected.isActive ? 'active' : 'inactive'}`}>{selected.isActive ? 'Active' : 'Blocked'}</span>
                    <span className="badge" style={{ background:'#f1f5f9', color:'#334155' }}>Joined {fmtDate(selected.createdAt)}</span>
                    {selected.gender && <span className="badge" style={{ background:'#f1f5f9', color:'#334155', textTransform:'capitalize' }}>{selected.gender}</span>}
                  </div>
                </div>
                <button className={`btn-admin ${selected.isActive ? 'danger' : 'success'}`} onClick={() => toggleUser(selected)}>
                  <i className={`fa fa-${selected.isActive ? 'ban' : 'check'}`} /> {selected.isActive ? 'Block User' : 'Unblock User'}
                </button>
              </div>

              {detailLoading ? (
                <div style={{ textAlign:'center', padding:40 }}><i className="fa fa-spinner fa-spin" style={{ fontSize:20, color:'#94a3b8' }} /></div>
              ) : detail && (
                <>
                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                    <div className="detail-block"><h4>Total Orders</h4><p style={{ fontSize:22, fontWeight:800 }}>{detail.stats?.totalOrders || 0}</p></div>
                    <div className="detail-block"><h4>Total Spent</h4><p style={{ fontSize:22, fontWeight:800, color:'#166534' }}>{fmt(detail.stats?.totalSpent || 0)}</p></div>
                  </div>

                  {/* Addresses */}
                  {detail.user?.addresses?.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <h4 style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#64748b', marginBottom:10 }}>Saved Addresses ({detail.user.addresses.length})</h4>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {detail.user.addresses.map((a, i) => (
                          <div key={i} className="detail-block">
                            <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{a.label || 'Address'} {a.isDefault && <span className="badge badge-active" style={{ fontSize:9 }}>Default</span>}</div>
                            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{a.name}<br />{a.line1}{a.line2 ? ', '+a.line2 : ''}<br />{a.city}, {a.state} - {a.pin}<br />{a.phone}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent orders */}
                  {detail.orders?.length > 0 && (
                    <>
                      <h4 style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#64748b', marginBottom:10 }}>Recent Orders</h4>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                          <tbody>
                            {detail.orders.slice(0, 5).map(o => (
                              <tr key={o._id}>
                                <td><strong style={{ fontFamily:'monospace', fontSize:12 }}>{o.orderId}</strong></td>
                                <td>{o.items?.length}</td>
                                <td>{fmt(o.total)}</td>
                                <td><span className={`badge badge-${o.status}`}>{o.status?.replace(/_/g,' ')}</span></td>
                                <td style={{ fontSize:12 }}>{fmtDate(o.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
