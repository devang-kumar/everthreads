import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { fmt } from '../../utils/format'
import toast from 'react-hot-toast'

const today = new Date().toISOString().slice(0, 10)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export default function AdminReports() {
  const [tab, setTab] = useState('sales')
  const [from, setFrom] = useState(thirtyDaysAgo)
  const [to, setTo] = useState(today)
  const [groupBy, setGroupBy] = useState('day')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ from, to, groupBy })
      let res
      if (tab === 'sales') res = await api.get(`/admin/reports/sales?${params}`)
      else if (tab === 'products') res = await api.get(`/admin/reports/products?${params}`)
      else res = await api.get(`/admin/reports/customers?${params}`)
      setData(res.data)
    } catch { toast.error('Failed to load report') }
    setLoading(false)
  }

  useEffect(() => { load() }, [tab, from, to, groupBy])

  const exportOrders = async () => {
    try {
      const params = new URLSearchParams({ from, to })
      const res = await api.get(`/admin/reports/export/orders?${params}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click()
      toast.success('Export started')
    } catch { toast.error('Export failed') }
  }

  const maxSales = Math.max(...(data?.salesData?.map(d => d.revenue) || [1]), 1)
  const maxNew = Math.max(...(data?.newCustomers?.map(d => d.count) || [1]), 1)
  const maxCat = Math.max(...(data?.categoryBreakdown?.map(c => c.revenue) || [1]), 1)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Reports</h1><p>Detailed business analytics and exports</p></div>
        <button className="btn-admin outline" onClick={exportOrders}><i className="fa fa-download" /> Export Orders CSV</button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        {[['sales','Sales Report'],['products','Product Report'],['customers','Customer Report']].map(([id,label]) => (
          <button key={id} className={`settings-tab${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Date range */}
      <div className="admin-card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div className="date-range">
            <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          {tab === 'sales' && (
            <select className="admin-select" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="day">Group by Day</option>
              <option value="week">Group by Week</option>
              <option value="month">Group by Month</option>
            </select>
          )}
          <button className="btn-admin primary" onClick={load}><i className="fa fa-sync" /> Refresh</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><i className="fa fa-spinner fa-spin" style={{ fontSize:28, color:'#94a3b8' }} /></div>
      ) : !data ? null : (
        <>
          {/* ── SALES REPORT ── */}
          {tab === 'sales' && (
            <>
              <div className="stats-grid" style={{ marginBottom:20 }}>
                {[
                  { label:'Total Revenue', value: fmt(data.summary?.totalRevenue || 0), icon:'fa-rupee-sign', color:'green' },
                  { label:'Total Orders', value: data.summary?.totalOrders || 0, icon:'fa-box', color:'' },
                  { label:'Avg Order Value', value: fmt(Math.round(data.summary?.avgOrderValue || 0)), icon:'fa-chart-line', color:'blue' },
                  { label:'Cancelled Orders', value: data.summary?.cancelledOrders || 0, icon:'fa-times-circle', color:'red' },
                  { label:'Delivered Orders', value: data.summary?.deliveredOrders || 0, icon:'fa-check-circle', color:'green' },
                  { label:'Total Discounts', value: fmt(data.summary?.totalDiscount || 0), icon:'fa-tag', color:'orange' },
                ].map(s => (
                  <div key={s.label} className={`stat-card ${s.color}`}>
                    <i className={`fa ${s.icon} stat-icon`} />
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="admin-card">
                <h3><i className="fa fa-chart-bar" /> Revenue Over Time</h3>
                <div className="bar-chart" style={{ height:160 }}>
                  {data.salesData?.map((d, i) => (
                    <div key={i} className="bar-col">
                      <div className="bar-val">{d.revenue > 0 ? fmt(d.revenue) : ''}</div>
                      <div className="bar" style={{ height: Math.max(4, (d.revenue / maxSales) * 140) + 'px' }} />
                      <div className="bar-label">{d._id}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card">
                <h3><i className="fa fa-credit-card" /> Payment Method Breakdown</h3>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Method</th><th>Orders</th><th>Revenue</th><th>Share</th></tr></thead>
                    <tbody>
                      {data.paymentBreakdown?.map(p => (
                        <tr key={p._id}>
                          <td><span className="badge" style={{ background:'#f1f5f9', color:'#334155', textTransform:'uppercase' }}>{p._id}</span></td>
                          <td><strong>{p.count}</strong></td>
                          <td>{fmt(p.revenue)}</td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ height:'100%', width: (p.revenue / (data.summary?.totalRevenue || 1)) * 100 + '%', background:'var(--accent)', borderRadius:3 }} />
                              </div>
                              <span style={{ fontSize:11, fontWeight:700, color:'#64748b', minWidth:36 }}>
                                {Math.round((p.revenue / (data.summary?.totalRevenue || 1)) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCT REPORT ── */}
          {tab === 'products' && (
            <>
              <div className="card-grid-2">
                <div className="admin-card">
                  <h3><i className="fa fa-trophy" /> Top Selling Products</h3>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>#</th><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
                      <tbody>
                        {data.topSelling?.length === 0
                          ? <tr><td colSpan={4} className="empty-cell">No sales data</td></tr>
                          : data.topSelling?.map((p, i) => (
                            <tr key={i}>
                              <td><strong style={{ color: i < 3 ? '#f59e0b' : '#64748b' }}>#{i+1}</strong></td>
                              <td>{p.name}</td>
                              <td><strong>{p.totalSold}</strong></td>
                              <td>{fmt(p.revenue)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="admin-card">
                  <h3><i className="fa fa-tags" /> Revenue by Category</h3>
                  {data.categoryBreakdown?.map(c => (
                    <div key={c._id} className="progress-bar-wrap">
                      <div className="progress-bar-label">
                        <span style={{ textTransform:'capitalize' }}>{c._id || 'Unknown'}</span>
                        <span>{fmt(c.revenue)} · {c.units} units</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: (c.revenue / maxCat) * 100 + '%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {data.lowStock?.length > 0 && (
                <div className="admin-card">
                  <h3><i className="fa fa-exclamation-triangle" style={{ color:'#f59e0b' }} /> Low Stock Alert ({data.lowStock.length} products)</h3>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Product</th><th>Category</th><th>Low Stock Sizes</th></tr></thead>
                      <tbody>
                        {data.lowStock.map(p => (
                          <tr key={p.productId}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.category}</td>
                            <td>{p.variants.map(v => <span key={v.size} className="stock-low" style={{ marginRight:8 }}>{v.size}: {v.stock}</span>)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CUSTOMER REPORT ── */}
          {tab === 'customers' && (
            <>
              <div className="stats-grid" style={{ marginBottom:20 }}>
                {[
                  { label:'Total Customers', value: data.summary?.total || 0, icon:'fa-users', color:'' },
                  { label:'Active Customers', value: data.summary?.active || 0, icon:'fa-user-check', color:'green' },
                ].map(s => (
                  <div key={s.label} className={`stat-card ${s.color}`}>
                    <i className={`fa ${s.icon} stat-icon`} />
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="card-grid-2">
                <div className="admin-card">
                  <h3><i className="fa fa-user-plus" /> New Customers Over Time</h3>
                  <div className="bar-chart" style={{ height:140 }}>
                    {data.newCustomers?.map((d, i) => (
                      <div key={i} className="bar-col">
                        <div className="bar-val">{d.count > 0 ? d.count : ''}</div>
                        <div className="bar blue" style={{ height: Math.max(4, (d.count / maxNew) * 120) + 'px' }} />
                        <div className="bar-label">{d._id?.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="admin-card">
                  <h3><i className="fa fa-crown" style={{ color:'#f59e0b' }} /> Top Customers by Spend</h3>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>#</th><th>Customer</th><th>Orders</th><th>Total Spent</th></tr></thead>
                      <tbody>
                        {data.topCustomers?.map((c, i) => (
                          <tr key={i}>
                            <td><strong style={{ color: i < 3 ? '#f59e0b' : '#64748b' }}>#{i+1}</strong></td>
                            <td><div style={{ fontWeight:600 }}>{c.name?.trim() || '—'}</div><div style={{ fontSize:11, color:'#64748b' }}>{c.email}</div></td>
                            <td>{c.orderCount}</td>
                            <td><strong>{fmt(c.totalSpent)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
