import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmt } from '../../utils/format'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', category: 'men', collection: '', tag: 'trending', price: '', originalPrice: '', badge: '', sizes: 'XS,S,M,L,XL,XXL', colors: '#1a1a1a,#ffffff', images: '', description: '', isFeatured: false, lowStockAlert: 5, defaultStock: 50 }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/inventory')
      setProducts(data.products || [])
    } catch { toast.error('Failed to load products') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  )
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pages = Math.ceil(filtered.length / PAGE_SIZE)

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (p) => {
    setEditId(p._id)
    setForm({
      name: p.name, category: p.category, collection: p.collection || '', tag: p.tag || 'trending',
      price: p.price, originalPrice: p.originalPrice, badge: p.badge || '',
      sizes: (p.sizes || []).join(','), colors: (p.colors || []).join(','),
      images: p.images?.[0] || '', description: p.description || '',
      isFeatured: p.isFeatured || false, lowStockAlert: p.lowStockAlert || 5, defaultStock: 50
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.originalPrice) { toast.error('Name, price and MRP are required'); return }
    if (+form.price > +form.originalPrice) { toast.error('Price cannot exceed MRP'); return }
    setSaving(true)
    const body = {
      ...form,
      price: +form.price, originalPrice: +form.originalPrice,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      images: form.images ? [form.images.trim()] : [],
      badge: form.badge || null,
      lowStockAlert: +form.lowStockAlert,
      defaultStock: +form.defaultStock,
    }
    try {
      if (editId) {
        await api.put(`/products/${editId}`, body)
        toast.success('Product updated ✅')
      } else {
        await api.post('/products', body)
        toast.success('Product created ✅')
      }
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    setSaving(false)
  }

  const handleToggleActive = async (p) => {
    try {
      await api.put(`/products/${p._id}`, { isActive: !p.isActive })
      toast.success(p.isActive ? 'Product deactivated' : 'Product activated')
      load()
    } catch { toast.error('Failed to update') }
    setDeleteTarget(null)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Products</h1><p>{products.length} total products</p></div>
        <button className="btn-admin primary" onClick={openAdd}><i className="fa fa-plus" /> Add Product</button>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="admin-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            {['men','women','unisex','accessories'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>{filtered.length} results</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>MRP</th><th>Stock</th><th>Badge</th><th>Featured</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="empty-cell"><i className="fa fa-spinner fa-spin" /> Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={10} className="empty-cell">No products found</td></tr>
              ) : paged.map(p => {
                const stock = p.variants?.reduce((s, v) => s + v.stock, 0) || 0
                const sc = stock === 0 ? 'stock-out' : stock <= (p.lowStockAlert || 5) ? 'stock-low' : 'stock-ok'
                return (
                  <tr key={p._id}>
                    <td>{p.images?.[0] ? <img src={p.images[0]} className="product-thumb" alt={p.name} onError={e => e.target.style.display = 'none'} /> : <div style={{ width: 44, height: 54, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><i className="fa fa-tshirt" /></div>}</td>
                    <td><strong>{p.name}</strong><div style={{ fontSize: 11, color: '#64748b' }}>#{p.productId} · {p.slug}</div></td>
                    <td><span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>{p.category}</span></td>
                    <td><strong>{fmt(p.price)}</strong></td>
                    <td style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{fmt(p.originalPrice)}</td>
                    <td><span className={sc}>{stock}</span></td>
                    <td>{p.badge ? <span className={`badge badge-${p.badge}`}>{p.badge}</span> : '—'}</td>
                    <td>{p.isFeatured ? <i className="fa fa-star" style={{ color: '#f59e0b' }} /> : '—'}</td>
                    <td><span className={`badge badge-${p.isActive ? 'active' : 'inactive'}`}>{p.isActive ? 'Active' : 'Hidden'}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Edit"><i className="fa fa-edit" /></button>
                        <button className={`btn-icon${p.isActive ? ' danger' : ''}`} onClick={() => setDeleteTarget(p)} title={p.isActive ? 'Deactivate' : 'Activate'}>
                          <i className={`fa fa-${p.isActive ? 'eye-slash' : 'eye'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="admin-pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><i className="fa fa-chevron-left" /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}><i className="fa fa-chevron-right" /></button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="admin-form">
                <div className="form-group"><label>Product Name *</label><input value={form.name} onChange={set('name')} placeholder="e.g. Oversized Drop Shoulder Tee" /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category *</label>
                    <select value={form.category} onChange={set('category')}>
                      {['men','women','unisex','accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Collection</label><input value={form.collection} onChange={set('collection')} placeholder="e.g. summer, drift, basics" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Selling Price (₹) *</label><input type="number" value={form.price} onChange={set('price')} placeholder="999" /></div>
                  <div className="form-group"><label>MRP (₹) *</label><input type="number" value={form.originalPrice} onChange={set('originalPrice')} placeholder="1499" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Badge</label>
                    <select value={form.badge} onChange={set('badge')}>
                      <option value="">None</option>
                      <option value="sale">Sale</option>
                      <option value="new">New</option>
                      <option value="hot">Hot</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Tag</label>
                    <select value={form.tag} onChange={set('tag')}>
                      {['trending','new','sale','featured','basics'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Sizes (comma-separated)</label><input value={form.sizes} onChange={set('sizes')} placeholder="XS,S,M,L,XL,XXL" /></div>
                <div className="form-group"><label>Colors (hex, comma-separated)</label><input value={form.colors} onChange={set('colors')} placeholder="#1a1a1a,#ffffff,#e63946" /></div>
                <div className="form-group"><label>Image URL</label><input value={form.images} onChange={set('images')} placeholder="https://..." /></div>
                {form.images && <img src={form.images} alt="preview" style={{ width: 80, height: 100, objectFit: 'cover', border: '1px solid #e2e8f0' }} onError={e => e.target.style.display = 'none'} />}
                <div className="form-group"><label>Description</label><textarea value={form.description} onChange={set('description')} placeholder="Product description..." /></div>
                <div className="form-row">
                  <div className="form-group"><label>Default Stock per Size</label><input type="number" value={form.defaultStock} onChange={set('defaultStock')} /></div>
                  <div className="form-group"><label>Low Stock Alert</label><input type="number" value={form.lowStockAlert} onChange={set('lowStockAlert')} /></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} />
                  Mark as Featured
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-admin primary" onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> {editId ? 'Update Product' : 'Create Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm toggle modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{deleteTarget.isActive ? 'Deactivate' : 'Activate'} Product</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>
                {deleteTarget.isActive
                  ? `"${deleteTarget.name}" will be hidden from the store.`
                  : `"${deleteTarget.name}" will be visible in the store.`}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-admin outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={`btn-admin ${deleteTarget.isActive ? 'danger' : 'primary'}`} onClick={() => handleToggleActive(deleteTarget)}>
                {deleteTarget.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
