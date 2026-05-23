import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmtDate } from '../../utils/format'
import toast from 'react-hot-toast'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [ratingFilter, setRatingFilter] = useState('')
  const [search, setSearch] = useState('')
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (ratingFilter) params.set('rating', ratingFilter)
      if (search) params.set('search', search)
      const { data } = await api.get(`/admin/reviews?${params}`)
      setReviews(data.reviews || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load reviews') }
    setLoading(false)
  }, [page, ratingFilter, search])

  useEffect(() => { load() }, [load])

  const deleteReview = async (productId, reviewId) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await api.delete(`/admin/reviews/${productId}/${reviewId}`)
      toast.success('Review deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const approveReview = async (productId, reviewId) => {
    try {
      await api.put(`/admin/reviews/${productId}/${reviewId}/approve`)
      toast.success('Review approved ✅')
      load()
    } catch { toast.error('Approve failed') }
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  const Stars = ({ n }) => (
    <span className="review-stars">
      {Array(5).fill(0).map((_, i) => (
        <i key={i} className={`fa fa-star${i < n ? '' : '-o'}`} style={{ color: i < n ? '#f59e0b' : '#e2e8f0' }} />
      ))}
    </span>
  )

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Product Reviews</h1><p>{total} total reviews</p></div>
      </div>

      {/* Rating filter pills */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['','5','4','3','2','1'].map(r => (
          <button key={r} onClick={() => { setRatingFilter(r); setPage(1) }}
            style={{ padding:'6px 14px', fontSize:12, fontWeight:700, border:`2px solid ${ratingFilter===r ? '#f59e0b' : '#e2e8f0'}`, background: ratingFilter===r ? '#fef3c7' : '#fff', color: ratingFilter===r ? '#92400e' : '#64748b', cursor:'pointer', transition:'all .2s' }}>
            {r ? `${r} ★` : 'All Ratings'}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search by reviewer name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <span style={{ fontSize:13, color:'#64748b', marginLeft:'auto' }}>{total} reviews</span>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><i className="fa fa-spinner fa-spin" style={{ fontSize:24, color:'#94a3b8' }} /></div>
        ) : reviews.length === 0 ? (
          <div className="empty-cell">No reviews found</div>
        ) : (
          <div>
            {reviews.map((r, i) => (
              <div key={i} className="review-row">
                {r.productImg
                  ? <img src={r.productImg} className="review-product-img" alt={r.productName} onError={e => e.target.style.display='none'} />
                  : <div className="review-product-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc' }}><i className="fa fa-tshirt" /></div>
                }
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                    <strong style={{ fontSize:13 }}>{r.review?.name}</strong>
                    <Stars n={r.review?.rating} />
                    {r.review?.verified && <span className="badge badge-active" style={{ fontSize:10 }}>Verified</span>}
                    <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>{fmtDate(r.review?.createdAt)}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>
                    Product: <strong>{r.productName}</strong> <span style={{ color:'#94a3b8' }}>#{r.productId}</span>
                  </div>
                  {r.review?.comment && <p className="review-text">"{r.review.comment}"</p>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                  {!r.review?.verified && (
                    <button className="btn-icon success" onClick={() => approveReview(r.productId, r.review._id)} title="Approve">
                      <i className="fa fa-check" />
                    </button>
                  )}
                  <button className="btn-icon danger" onClick={() => deleteReview(r.productId, r.review._id)} title="Delete">
                    <i className="fa fa-trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
