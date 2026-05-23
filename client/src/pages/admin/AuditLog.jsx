import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmtTime } from '../../utils/format'
import toast from 'react-hot-toast'

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const PAGE_SIZE = 25

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (search) params.set('action', search)
      const { data } = await api.get(`/admin/audit-logs?${params}`)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load audit logs') }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const pages = Math.ceil(total / PAGE_SIZE)

  const ACTION_COLOR = {
    CREATE: '#166534', UPDATE: '#1d4ed8', DELETE: '#991b1b',
    BLOCK: '#92400e', UNBLOCK: '#166534', RESTOCK: '#0e7490'
  }
  const getColor = (action) => {
    const key = Object.keys(ACTION_COLOR).find(k => action?.startsWith(k))
    return ACTION_COLOR[key] || '#374151'
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Audit Log</h1><p>Complete record of all admin actions</p></div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Filter by action (e.g. UPDATE, DELETE)..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <span style={{ fontSize:13, color:'#64748b', marginLeft:'auto' }}>{total} log entries</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th><th>IP</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="empty-cell"><i className="fa fa-spinner fa-spin" /></td></tr>
              : logs.length === 0 ? <tr><td colSpan={7} className="empty-cell">No audit logs found</td></tr>
              : logs.map((l, i) => (
                <tr key={i}>
                  <td style={{ fontSize:11, whiteSpace:'nowrap' }}>{fmtTime(l.createdAt)}</td>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{l.admin ? `${l.admin.firstName} ${l.admin.lastName}` : '—'}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{l.adminEmail}</div>
                  </td>
                  <td>
                    <span className="audit-action" style={{ color: getColor(l.action), background: getColor(l.action) + '15' }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ fontSize:12 }}>{l.entity || '—'}</td>
                  <td style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{l.entityId ? l.entityId.slice(-8) : '—'}</td>
                  <td style={{ fontSize:11, color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {l.details ? JSON.stringify(l.details).slice(0, 80) : '—'}
                  </td>
                  <td style={{ fontSize:11, color:'#94a3b8' }}>{l.ip || '—'}</td>
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
    </div>
  )
}
