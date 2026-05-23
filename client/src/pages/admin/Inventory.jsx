import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmtTime } from '../../utils/format'
import toast from 'react-hot-toast'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [restockTarget, setRestockTarget] = useState(null)
  const [restockSize, setRestockSize] = useState('')
  const [restockQty, setRestockQty] = useState(50)
  const [restockNote, setRestockNote] = useState('')
  const [restocking, setRestocking] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/inventory')
      setProducts(data.products || [])
    } catch { toast.error('Failed to load inventory') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const total = p.variants?.reduce((s, v) => s + v.stock, 0) || 0
    return (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (!catFilter || p.category === catFilter) &&
      (!stockFilter || (stockFilter === 'low' && total > 0 && total <= (p.lowStockAlert || 5)) || (stockFilter === 'out' && total === 0))
  })

  const openRestock = (p) => {
    setRestockTarget(p)
    setRestockSize(p.variants?.[0]?.size || p.sizes?.[0] || 'M')
    setRestockQty(50)
    setRestockNote('')
  }

  const submitRestock = async () => {
    if (!restockQty || restockQty < 1) { toast.error('Enter a valid quantity'); return }
    setRestocking(true)
    try {
      await api.put(`/admin/inventory/${restockTarget.productId}/restock`, { size: restockSize, qty: +restockQty, note: restockNote })
      toast.success('Restocked successfully ✅')
      setRestockTarget(null)
      load()
    } catch { toast.error('Restock failed') }
    setRestocking(false)
  }

  const loadLogs = async () => {
    setShowLogs(true)
    setLogsLoading(true)
    try {
      const { data } = await api.get('/inventory/logs?limit=100')
      setLogs(data.logs || [])
    } catch { setLogs([]) }
    setLogsLoading(false)
  }

  const exportCSV = () => {
    const rows = [['Product', 'Category', ...SIZES, 'Total']]
    filtered.forEach(p => {
      const stocks = SIZES.map(sz => p.variants?.find(v => v.size === sz)?.stock ?? 0)
      rows.push([p.name, p.category, ...stocks, stocks.reduce((a, b) => a + b, 0)])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'inventory.csv'; a.click()
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Inventory</h1><p>Manage stock levels across all products</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-admin outline" onClick={loadLogs}><i className="fa fa-history" /> View Logs</button>
          <button className="btn-admin outline" onClick={exportCSV}><i className="fa fa-download" /> Export CSV</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="admin-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {['men','women','unisex','accessories'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="admin-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Product</th><th>Category</th>{SIZES.map(s => <th key={s} style={{ textAlign: 'center' }}>{s}</th>)}<th>Total</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="empty-cell"><i className="fa fa-spinner fa-spin" /> Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="empty-cell">No products found</td></tr>
              ) : filtered.map(p => {
                const total = p.variants?.reduce((s, v) => s + v.stock, 0) || 0
                const tc = total === 0 ? 'stock-out' : total <= (p.lowStockAlert || 5) ? 'stock-low' : 'stock-ok'
                return (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong><br /><span style={{ fontSize: 11, color: '#64748b' }}>#{p.productId}</span></td>
                    <td>{p.category}</td>
                    {SIZES.map(sz => {
                      const v = p.variants?.find(x => x.size === sz)
                      if (!v) return <td key={sz} className="stock-cell" style={{ color: '#cbd5e1', textAlign: 'center' }}>—</td>
                      const c = v.stock === 0 ? 'stock-out' : v.stock <= (p.lowStockAlert || 5) ? 'stock-low' : 'stock-ok'
                      return <td key={sz} className="stock-cell"><span className={c}>{v.stock}</span></td>
                    })}
                    <td><span className={tc}>{total}</span></td>
                    <td><button className="btn-sm" onClick={() => openRestock(p)}><i className="fa fa-plus" /> Restock</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockTarget && (
        <div className="modal-overlay" onClick={() => setRestockTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Restock — {restockTarget.name}</h2>
              <button className="modal-close" onClick={() => setRestockTarget(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="admin-form">
                <div className="form-group">
                  <label>Size</label>
                  <select value={restockSize} onChange={e => setRestockSize(e.target.value)}>
                    {(restockTarget.variants?.map(v => v.size) || restockTarget.sizes || SIZES).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity to Add</label>
                  <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} min={1} />
                </div>
                <div className="form-group">
                  <label>Note (optional)</label>
                  <input value={restockNote} onChange={e => setRestockNote(e.target.value)} placeholder="e.g. Regular restock" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setRestockTarget(null)}>Cancel</button>
              <button className="btn-admin primary" onClick={submitRestock} disabled={restocking}>
                {restocking ? <><i className="fa fa-spinner fa-spin" /> Restocking...</> : 'Confirm Restock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Inventory Logs</h2>
              <button className="modal-close" onClick={() => setShowLogs(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Time</th><th>Product</th><th>Size</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>Note</th></tr></thead>
                  <tbody>
                    {logsLoading ? (
                      <tr><td colSpan={8} className="empty-cell"><i className="fa fa-spinner fa-spin" /></td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan={8} className="empty-cell">No logs found</td></tr>
                    ) : logs.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 11 }}>{fmtTime(l.createdAt)}</td>
                        <td>{l.productName}</td>
                        <td>{l.size || '—'}</td>
                        <td><span className="badge" style={{ background: l.type === 'restock' ? '#d1fae5' : l.type === 'sale' ? '#dbeafe' : '#fef3c7', color: l.type === 'restock' ? '#065f46' : l.type === 'sale' ? '#1e40af' : '#92400e' }}>{l.type}</span></td>
                        <td><strong>{l.type === 'sale' ? '-' : '+'}{l.qty}</strong></td>
                        <td>{l.before ?? '—'}</td>
                        <td>{l.after ?? '—'}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{l.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
