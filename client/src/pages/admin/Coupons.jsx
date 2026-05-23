import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmt, fmtDate } from '../../utils/format'
import toast from 'react-hot-toast'

const EMPTY = { code: '', description: '', type: 'percentage', value: '', minOrderValue: 0, maxDiscount: '', usageLimit: 0, perUserLimit: 1, isActive: true, validFrom: '', validUntil: '' }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const { data } = await api.get(`/admin/coupons?${params}`)
      setCoupons(data.coupons || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load coupons') }
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditId(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (c) => {
    setEditId(c._id)
    setForm({
      code: c.code, description: c.description || '', type: c.type, value: c.value,
      minOrderValue: c.minOrderValue || 0, maxDiscount: c.maxDiscount || '',
      usageLimit: c.usageLimit || 0, perUserLimit: c.perUserLimit || 1,
      isActive: c.isActive,
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.value) { toast.error('Code and value are required'); return }
    setSaving(true)
    const body = { ...form, value: +form.value, minOrderValue: +form.minOrderValue, usageLimit: +form.usageLimit, perUserLimit: +form.perUserLimit, maxDiscount: form.maxDiscount ? +form.maxDiscount : undefined, validFrom: form.validFrom || undefined, validUntil: form.validUntil || undefined }
    try {
      if (editId) { await api.put(`/admin/coupons/${editId}`, body); toast.success('Coupon updated ✅') }
      else { await api.post('/admin/coupons', body); toast.success('Coupon created ✅') }
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/coupons/${deleteTarget._id}`)
      toast.success('Coupon deleted')
      setDeleteTarget(null); load()
    } catch { toast.error('Delete failed') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Coupons & Discounts</h1><p>{total} coupons total</p></div>
        <button className="btn-admin primary" onClick={openAdd}><i className="fa fa-plus" /> Create Coupon</button>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search coupon code..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used / Limit</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="empty-cell"><i className="fa fa-spinner fa-spin" /></td></tr>
              : coupons.length === 0 ? <tr><td colSpan={8} className="empty-cell">No coupons found</td></tr>
              : coupons.map(c => (
                <tr key={c._id}>
                  <td>
                    <div className="coupon-code" style={{ fontSize: 14 }}>{c.code}</div>
                    {c.description && <div style={{ fontSize: 11, color: '#64748b' }}>{c.description}</div>}
                  </td>
                  <td><span className="badge" style={{ background: c.type === 'percentage' ? '#dbeafe' : '#dcfce7', color: c.type === 'percentage' ? '#1d4ed8' : '#166534' }}>{c.type}</span></td>
                  <td><strong className="coupon-value" style={{ fontSize: 15 }}>{c.type === 'percentage' ? `${c.value}%` : fmt(c.value)}</strong></td>
                  <td>{c.minOrderValue > 0 ? fmt(c.minOrderValue) : '—'}</td>
                  <td>{c.usedCount} / {c.usageLimit === 0 ? '∞' : c.usageLimit}</td>
                  <td style={{ fontSize: 12 }}>{c.validUntil ? fmtDate(c.validUntil) : '—'}</td>
                  <td><span className={`badge badge-${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(c)} title="Edit"><i className="fa fa-edit" /></button>
                      <button className="btn-icon danger" onClick={() => setDeleteTarget(c)} title="Delete"><i className="fa fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="admin-form">
                <div className="form-row">
                  <div className="form-group"><label>Coupon Code *</label><input value={form.code} onChange={set('code')} placeholder="e.g. SUMMER20" style={{ textTransform: 'uppercase' }} /></div>
                  <div className="form-group"><label>Type *</label>
                    <select value={form.type} onChange={set('type')}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Value * {form.type === 'percentage' ? '(%)' : '(₹)'}</label><input type="number" value={form.value} onChange={set('value')} placeholder={form.type === 'percentage' ? '20' : '100'} /></div>
                  <div className="form-group"><label>Max Discount (₹) {form.type === 'flat' ? '— N/A' : ''}</label><input type="number" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="Optional cap" disabled={form.type === 'flat'} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Min Order Value (₹)</label><input type="number" value={form.minOrderValue} onChange={set('minOrderValue')} /></div>
                  <div className="form-group"><label>Usage Limit (0 = unlimited)</label><input type="number" value={form.usageLimit} onChange={set('usageLimit')} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Per User Limit</label><input type="number" value={form.perUserLimit} onChange={set('perUserLimit')} /></div>
                  <div className="form-group"><label>Status</label>
                    <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Valid From</label><input type="date" value={form.validFrom} onChange={set('validFrom')} /></div>
                  <div className="form-group"><label>Valid Until</label><input type="date" value={form.validUntil} onChange={set('validUntil')} /></div>
                </div>
                <div className="form-group"><label>Description</label><input value={form.description} onChange={set('description')} placeholder="e.g. Summer sale discount" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-admin primary" onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> {editId ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Delete Coupon</h2><button className="modal-close" onClick={() => setDeleteTarget(null)}><i className="fa fa-times" /></button></div>
            <div className="modal-body"><p style={{ fontSize: 14 }}>Delete coupon <strong>{deleteTarget.code}</strong>? This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-admin danger" onClick={handleDelete}><i className="fa fa-trash" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
