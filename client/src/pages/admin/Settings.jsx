import { useState, useEffect } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const TABS = [
  { id:'general', label:'General', icon:'fa-store' },
  { id:'shipping', label:'Shipping', icon:'fa-truck' },
  { id:'payment', label:'Payment', icon:'fa-credit-card' },
  { id:'tax', label:'Tax / GST', icon:'fa-percent' },
  { id:'policy', label:'Policy', icon:'fa-file-contract' },
  { id:'inventory', label:'Inventory', icon:'fa-warehouse' },
  { id:'seo', label:'SEO', icon:'fa-search' },
]

export default function AdminSettings() {
  const [tab, setTab] = useState('general')
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState({})

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      const flat = {}
      r.data.settings?.forEach(s => { flat[s.key] = s.value })
      setSettings(flat)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const set = (key, val) => {
    setSettings(s => ({ ...s, [key]: val }))
    setChanged(c => ({ ...c, [key]: val }))
  }

  const save = async () => {
    if (!Object.keys(changed).length) { toast('No changes to save'); return }
    setSaving(true)
    try {
      await api.put('/admin/settings', changed)
      toast.success('Settings saved ✅')
      setChanged({})
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const Field = ({ label, k, type='text', hint, options }) => (
    <div className="form-group">
      <label>{label}</label>
      {options ? (
        <select value={settings[k] ?? ''} onChange={e => set(k, e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'toggle' ? (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', textTransform:'none', letterSpacing:0, fontSize:13, fontWeight:400 }}>
            <input type="checkbox" checked={!!settings[k]} onChange={e => set(k, e.target.checked)} style={{ width:16, height:16 }} />
            {settings[k] ? 'Enabled' : 'Disabled'}
          </label>
        </div>
      ) : type === 'textarea' ? (
        <textarea value={settings[k] ?? ''} onChange={e => set(k, e.target.value)} rows={3} />
      ) : (
        <input type={type} value={settings[k] ?? ''} onChange={e => set(k, type==='number' ? +e.target.value : e.target.value)} />
      )}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  )

  if (loading) return <div style={{ textAlign:'center', padding:60 }}><i className="fa fa-spinner fa-spin" style={{ fontSize:24, color:'#94a3b8' }} /></div>

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Store Settings</h1><p>Configure your store preferences</p></div>
        <button className="btn-admin primary" onClick={save} disabled={saving}>
          {saving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> Save Changes</>}
          {Object.keys(changed).length > 0 && <span style={{ marginLeft:6, background:'var(--accent)', color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{Object.keys(changed).length}</span>}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:24, alignItems:'start' }}>
        {/* Sidebar tabs */}
        <div className="admin-card" style={{ padding:0, overflow:'hidden' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ width:'100%', padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #f1f5f9', background: tab===t.id ? '#0f172a' : '#fff', color: tab===t.id ? '#fff' : '#374151', transition:'all .2s', cursor:'pointer' }}>
              <i className={`fa ${t.icon}`} style={{ width:16, fontSize:13 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Settings panel */}
        <div className="admin-card">
          {tab === 'general' && (
            <div className="admin-form">
              <div className="form-section-title">Store Information</div>
              <Field label="Store Name" k="store_name" />
              <Field label="Support Email" k="store_email" type="email" />
              <Field label="Support Phone" k="store_phone" />
              <Field label="Store Address" k="store_address" type="textarea" />
              <Field label="Currency" k="currency" options={[{value:'INR',label:'INR — Indian Rupee'},{value:'USD',label:'USD — US Dollar'}]} />
              <div className="form-section"><div className="form-section-title">Announcement Bar</div>
                <Field label="Announcement Text" k="announcement_text" type="textarea" hint="Separate multiple messages with •" />
              </div>
              <div className="form-section"><div className="form-section-title">Store Status</div>
                <Field label="Maintenance Mode" k="maintenance_mode" type="toggle" hint="When enabled, customers see a maintenance page" />
              </div>
            </div>
          )}

          {tab === 'shipping' && (
            <div className="admin-form">
              <div className="form-section-title">Shipping Configuration</div>
              <Field label="Free Shipping Threshold (₹)" k="free_shipping_threshold" type="number" hint="Orders above this amount get free shipping" />
              <Field label="Standard Shipping Fee (₹)" k="standard_shipping_fee" type="number" />
              <Field label="COD Fee (₹)" k="cod_fee" type="number" hint="Extra fee charged for Cash on Delivery orders" />
            </div>
          )}

          {tab === 'payment' && (
            <div className="admin-form">
              <div className="form-section-title">Payment Settings</div>
              <Field label="Prepaid Discount (%)" k="prepaid_discount_pct" type="number" hint="Discount given when customer pays online (Razorpay)" />
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', padding:14, fontSize:13, color:'#92400e', marginTop:8 }}>
                <i className="fa fa-info-circle" style={{ marginRight:8 }} />
                Razorpay API keys are configured via environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) for security.
              </div>
            </div>
          )}

          {tab === 'tax' && (
            <div className="admin-form">
              <div className="form-section-title">GST / Tax Configuration</div>
              <Field label="GSTIN" k="gstin" hint="Your GST Identification Number" />
              <Field label="GST Rate (%)" k="gst_rate" type="number" />
              <Field label="GST Included in Price" k="gst_included" type="toggle" hint="If enabled, displayed prices include GST" />
            </div>
          )}

          {tab === 'policy' && (
            <div className="admin-form">
              <div className="form-section-title">Return Policy</div>
              <Field label="Return Window (days)" k="return_window_days" type="number" hint="Number of days after delivery within which returns are accepted" />
            </div>
          )}

          {tab === 'inventory' && (
            <div className="admin-form">
              <div className="form-section-title">Inventory Alerts</div>
              <Field label="Low Stock Alert Threshold" k="low_stock_alert_threshold" type="number" hint="Get alerted when stock falls below this number" />
            </div>
          )}

          {tab === 'seo' && (
            <div className="admin-form">
              <div className="form-section-title">SEO Settings</div>
              <Field label="Meta Title" k="meta_title" hint="Appears in browser tab and search results" />
              <Field label="Meta Description" k="meta_description" type="textarea" hint="Short description for search engines (150-160 chars)" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
