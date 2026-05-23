import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { fmt, fmtDate } from '../../utils/format'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <i className="fa fa-spinner fa-spin" style={{ fontSize:28, color:'#94a3b8' }} />
    </div>
  )
  if (!data) return (
    <div className="admin-card">
      <p style={{ color:'#991b1b', fontSize:14 }}>⚠️ Could not load dashboard. Make sure the backend is running on port 5000.</p>
    </div>
  )

  const { stats, statusCounts, last7, lowStock, recentOrders } = data

  const STAT_CARDS = [
    { label:'Total Revenue', value: fmt(stats.revenue), icon:'fa-rupee-sign', color:'green', sub:'All time (excl. cancelled)', link:'/admin/reports' },
    { label:'Total Orders', value: stats.totalOrders?.toLocaleString(), icon:'fa-box', color:'', sub:`${stats.todayOrders} today`, link:'/admin/orders' },
    { label:'Total Customers', value: stats.totalUsers?.toLocaleString(), icon:'fa-users', color:'blue', sub:'Registered users', link:'/admin/customers' },
    { label:'Active Products', value: stats.totalProducts, icon:'fa-tshirt', color:'', sub:'In store', link:'/admin/products' },
    { label:"Today's Revenue", value: fmt(stats.todayRevenue), icon:'fa-calendar-day', color:'green', sub:`${stats.todayOrders} orders today`, link:'/admin/reports' },
    { label:'Low Stock Items', value: lowStock?.length, icon:'fa-exclamation-triangle', color: lowStock?.length > 0 ? 'red' : '', sub: lowStock?.length > 0 ? 'Need restocking' : 'All good ✅', link:'/admin/inventory' },
    { label:'Pending Returns', value: stats.pendingReturns || 0, icon:'fa-undo', color: stats.pendingReturns > 0 ? 'orange' : '', sub:'Awaiting action', link:'/admin/returns' },
    { label:'Notifications', value: stats.unreadNotifications || 0, icon:'fa-bell', color: stats.unreadNotifications > 0 ? 'orange' : '', sub:'Unread', link:'/admin' },
  ]

  const STATUS_COLORS = { confirmed:'#1d4ed8', processing:'#92400e', packed:'#4c1d95', shipped:'#0e7490', out_for_delivery:'#92400e', delivered:'#166534', cancelled:'#991b1b', pending:'#92400e', returned:'#374151' }
  const maxR = Math.max(...(last7?.map(d => d.revenue) || [1]), 1)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Dashboard</h1><p>Welcome back! Here's your store overview.</p></div>
        <button className="btn-admin outline" onClick={() => window.location.reload()}><i className="fa fa-sync" /> Refresh</button>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`} style={{ cursor:'pointer' }} onClick={() => navigate(s.link)}>
            <i className={`fa ${s.icon} stat-icon`} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.sub && <div className="stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="card-grid-2">
        <div className="admin-card">
          <h3><i className="fa fa-chart-bar" /> Revenue — Last 7 Days</h3>
          <div className="bar-chart" style={{ height:120 }}>
            {last7?.map((d, i) => (
              <div key={i} className="bar-col">
                <div className="bar-val">{d.revenue > 0 ? fmt(d.revenue) : ''}</div>
                <div className="bar" style={{ height: Math.max(4, (d.revenue / maxR) * 100) + 'px' }} />
                <div className="bar-label">{d.date}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <h3><i className="fa fa-chart-pie" /> Order Status Breakdown</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {Object.entries(statusCounts || {}).map(([s, c]) => (
              <div key={s} style={{ background:(STATUS_COLORS[s]||'#374151')+'18', color:STATUS_COLORS[s]||'#374151', padding:'6px 12px', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }} onClick={() => navigate(`/admin/orders?status=${s}`)}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLORS[s]||'#374151', display:'inline-block' }} />
                {s.replace(/_/g,' ')}: {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="card-grid-2">
        <div className="admin-card">
          <h3><i className="fa fa-clock" /> Recent Orders</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recentOrders?.length === 0
                  ? <tr><td colSpan={5} className="empty-cell">No orders yet</td></tr>
                  : recentOrders?.map(o => (
                    <tr key={o._id} style={{ cursor:'pointer' }} onClick={() => navigate('/admin/orders')}>
                      <td><strong style={{ fontFamily:'monospace', fontSize:12 }}>{o.orderId}</strong></td>
                      <td style={{ fontSize:13 }}>{o.user ? `${o.user.firstName} ${o.user.lastName}` : o.userEmail}</td>
                      <td>{fmt(o.total)}</td>
                      <td><span className={`badge badge-${o.status}`}>{o.status?.replace(/_/g,' ')}</span></td>
                      <td style={{ fontSize:12 }}>{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <h3><i className="fa fa-exclamation-triangle" style={{ color:'#f59e0b' }} /> Low Stock Alert</h3>
          {!lowStock?.length
            ? <p style={{ color:'#166534', fontSize:13, display:'flex', alignItems:'center', gap:8 }}><i className="fa fa-check-circle" /> All products well stocked</p>
            : <div>
                {lowStock.slice(0, 8).map(p => (
                  <div key={p.productId} className="low-stock-item">
                    <div>
                      <div className="low-stock-name">{p.name}</div>
                      <div className="low-stock-detail">{p.variants?.map(v => `${v.size}: ${v.stock}`).join(' · ')}</div>
                    </div>
                    <button className="btn-sm" onClick={() => navigate('/admin/inventory')}>Restock</button>
                  </div>
                ))}
                {lowStock.length > 8 && <p style={{ fontSize:12, color:'#64748b', marginTop:8 }}>+{lowStock.length - 8} more items need restocking</p>}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
