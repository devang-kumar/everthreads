import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { fmt } from '../../utils/format'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><i className="fa fa-spinner fa-spin" style={{ fontSize: 24, color: '#94a3b8' }} /></div>
  if (!data) return <div className="admin-card"><p style={{ color: '#991b1b' }}>⚠️ Could not load analytics. Make sure the backend is running.</p></div>

  const { topProducts, categoryRevenue, monthly } = data
  const maxM = Math.max(...(monthly?.map(m => m.revenue) || [1]), 1)
  const maxC = Math.max(...(categoryRevenue?.map(c => c.revenue) || [1]), 1)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Analytics</h1><p>Sales performance and insights</p></div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h3>Monthly Revenue (Last 6 Months)</h3>
        <div className="bar-chart" style={{ height: 160 }}>
          {monthly?.map((m, i) => (
            <div key={i} className="bar-col">
              <div className="bar-val" style={{ fontSize: 10 }}>{m.revenue > 0 ? fmt(m.revenue) : ''}</div>
              <div className="bar" style={{ height: Math.max(4, (m.revenue / maxM) * 140) + 'px', background: '#1a1a1a' }} />
              <div className="bar-label">{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="admin-card">
          <h3>Revenue by Category</h3>
          {categoryRevenue?.map(c => (
            <div key={c._id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ textTransform: 'capitalize' }}>{c._id}</span>
                <span>{fmt(c.revenue)}</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: (c.revenue / maxC) * 100 + '%', background: 'var(--accent)', borderRadius: 4, transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{c.units} units sold</div>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <h3>Top 10 Products</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts?.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No sales data yet</td></tr>
                ) : topProducts?.map((p, i) => (
                  <tr key={i}>
                    <td><strong>#{i + 1}</strong></td>
                    <td>{p.name}</td>
                    <td><strong>{p.totalSold}</strong></td>
                    <td>{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
