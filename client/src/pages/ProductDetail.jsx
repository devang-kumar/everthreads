import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { fmt, fmtDate } from '../utils/format'
import ProductCard from '../components/product/ProductCard'
import toast from 'react-hot-toast'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImg, setSelectedImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  // Review form
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data.product)
        if (data.product?.sizes?.length) setSelectedSize(data.product.sizes[0])
        // Check wishlist
        const wl = JSON.parse(localStorage.getItem('bc_wishlist') || '[]')
        setWishlisted(wl.includes(data.product.productId))
        // Load related products
        if (data.product?.category) {
          const rel = await api.get(`/products?category=${data.product.category}&limit=4`)
          setRelated((rel.data.products || []).filter(p => p.productId !== data.product.productId).slice(0, 4))
        }
      } catch { setProduct(null) }
      setLoading(false)
    }
    load()
  }, [id])

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); toast.error('Please select a size'); return }
    setSizeError(false)
    addToCart(product, selectedSize, qty)
    toast.success(`Added to bag 🛍️`)
  }

  const handleBuyNow = () => {
    if (!selectedSize) { setSizeError(true); toast.error('Please select a size'); return }
    setSizeError(false)
    addToCart(product, selectedSize, qty)
    navigate('/checkout')
  }

  const handleWishlist = () => {
    const wl = JSON.parse(localStorage.getItem('bc_wishlist') || '[]')
    const idx = wl.indexOf(product.productId)
    if (idx === -1) { wl.push(product.productId); toast('Added to wishlist ❤️'); setWishlisted(true) }
    else { wl.splice(idx, 1); toast('Removed from wishlist'); setWishlisted(false) }
    localStorage.setItem('bc_wishlist', JSON.stringify(wl))
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isLoggedIn()) { toast.error('Please login to write a review'); navigate('/login'); return }
    setSubmittingReview(true)
    try {
      const { data } = await api.post(`/products/${product.productId}/review`, reviewForm)
      if (data.success) {
        toast.success('Review submitted ✅')
        setProduct(p => ({ ...p, reviews: data.reviews, rating: data.rating, numReviews: data.reviews.length }))
        setReviewForm({ rating: 5, comment: '' })
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review') }
    setSubmittingReview(false)
  }

  const getStockForSize = (size) => {
    const v = product?.variants?.find(v => v.size === size)
    return v?.stock ?? 0
  }

  if (loading) return (
    <div className="container" style={{ padding: '60px 20px' }}>
      <div className="product-detail-skeleton">
        <div className="skeleton-img" />
        <div className="skeleton-info">
          <div className="skeleton-line w60" />
          <div className="skeleton-line w40" />
          <div className="skeleton-line w80" />
          <div className="skeleton-line w60" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <i className="fa fa-exclamation-circle" style={{ fontSize: 48, color: '#ddd', display: 'block', marginBottom: 20 }} />
      <h2>Product not found</h2>
      <p style={{ color: 'var(--gray)', margin: '12px 0 24px' }}>This product may have been removed or is no longer available.</p>
      <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex' }}>Back to Shop</Link>
    </div>
  )

  const save = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const selectedStock = selectedSize ? getStockForSize(selectedSize) : null
  const isOutOfStock = selectedStock === 0

  const Stars = ({ n, size = 14 }) => (
    <span style={{ color: '#f59e0b', fontSize: size, letterSpacing: 1 }}>
      {Array(5).fill(0).map((_, i) => (
        <i key={i} className={`fa fa-star${i < Math.round(n) ? '' : '-o'}`} />
      ))}
    </span>
  )

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} style={{ textTransform: 'capitalize' }}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          {/* ── IMAGES ── */}
          <div className="product-images">
            <div className="main-image">
              {product.images?.[selectedImg]
                ? <img src={product.images[selectedImg]} alt={product.name} />
                : <div className="img-placeholder"><i className="fa fa-tshirt" /></div>
              }
              {product.badge && <span className={`product-badge ${product.badge}`}>{product.badge.toUpperCase()}</span>}
              {isOutOfStock && selectedSize && (
                <div className="out-of-stock-overlay">OUT OF STOCK</div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="image-thumbs">
                {product.images.map((img, i) => (
                  <div key={i} className={`thumb${selectedImg === i ? ' active' : ''}`} onClick={() => setSelectedImg(i)}>
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── INFO PANEL ── */}
          <div className="product-info-panel">
            <div className="product-category-tag">
              <Link to={`/shop?category=${product.category}`} style={{ textTransform: 'capitalize', color: 'var(--gray)' }}>{product.category}</Link>
              {product.collection && <> · {product.collection}</>}
            </div>

            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            {product.numReviews > 0 && (
              <div className="product-rating" onClick={() => setActiveTab('reviews')} style={{ cursor: 'pointer' }}>
                <Stars n={product.rating} />
                <span>{product.rating?.toFixed(1)} ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Price */}
            <div className="product-price-row">
              <span className="price-big">{fmt(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="price-orig">{fmt(product.originalPrice)}</span>
                  <span className="price-save-badge">Save {save}%</span>
                </>
              )}
            </div>
            <p className="price-tax-note">Inclusive of all taxes · Free shipping above ₹999</p>

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="product-option-group">
                <label>Colors</label>
                <div className="color-swatches">
                  {product.colors.map(c => (
                    <span key={c} className="color-swatch" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="product-option-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label>
                    Size
                    {sizeError && <span className="size-error"> — Please select a size</span>}
                  </label>
                  <button style={{ fontSize: 11, color: 'var(--gray)', textDecoration: 'underline' }}>Size Guide</button>
                </div>
                <div className="size-options">
                  {product.sizes.map(s => {
                    const stock = getStockForSize(s)
                    return (
                      <button
                        key={s}
                        className={`size-btn${selectedSize === s ? ' active' : ''}${stock === 0 ? ' out' : ''}`}
                        onClick={() => { if (stock > 0) { setSelectedSize(s); setSizeError(false) } }}
                        title={stock === 0 ? 'Out of stock' : `${stock} left`}
                      >
                        {s}
                        {stock === 0 && <span className="size-out-line" />}
                      </button>
                    )
                  })}
                </div>
                {selectedSize && selectedStock !== null && selectedStock <= 5 && selectedStock > 0 && (
                  <p className="low-stock-warn"><i className="fa fa-exclamation-triangle" /> Only {selectedStock} left in stock!</p>
                )}
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="add-to-cart-row">
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button
                className="btn-primary add-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <i className="fa fa-shopping-bag" />
                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
              </button>
            </div>

            {/* Buy Now */}
            {!isOutOfStock && (
              <button className="btn-buy-now" onClick={handleBuyNow}>
                <i className="fa fa-bolt" /> BUY NOW
              </button>
            )}

            {/* Wishlist + Share */}
            <div className="product-actions-row">
              <button className={`action-btn${wishlisted ? ' wishlisted' : ''}`} onClick={handleWishlist}>
                <i className={`fa${wishlisted ? 's' : 'r'} fa-heart`} />
                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
              <button className="action-btn" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied!') }}>
                <i className="fa fa-share-alt" /> Share
              </button>
            </div>

            {/* Trust features */}
            <div className="product-features">
              {[
                { icon: 'fa-truck', text: 'Free shipping above ₹999' },
                { icon: 'fa-undo', text: '7-day easy returns' },
                { icon: 'fa-shield-alt', text: 'Secure payment — UPI, Card, COD' },
                { icon: 'fa-box', text: 'Ships within 48 hours' },
                { icon: 'fa-certificate', text: '100% authentic product' },
              ].map(f => (
                <div key={f.text} className="product-feature-item">
                  <i className={`fa ${f.icon}`} />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS: Description / Reviews ── */}
        <div className="product-tabs">
          <div className="tab-nav">
            {[
              { id: 'description', label: 'Description' },
              { id: 'reviews', label: `Reviews (${product.numReviews || 0})` },
              { id: 'shipping', label: 'Shipping & Returns' },
            ].map(t => (
              <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="tab-pane">
                <p>{product.description || 'Premium quality streetwear made in India with the finest fabrics. Designed for all-day comfort and effortless style.'}</p>
                {product.sizes?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <strong style={{ fontSize: 13 }}>Available Sizes:</strong>
                    <p style={{ marginTop: 6, color: 'var(--gray)', fontSize: 13 }}>{product.sizes.join(' · ')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-pane">
                {/* Rating summary */}
                {product.numReviews > 0 && (
                  <div className="rating-summary">
                    <div className="rating-big">{product.rating?.toFixed(1)}</div>
                    <div>
                      <Stars n={product.rating} size={18} />
                      <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>{product.numReviews} review{product.numReviews !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )}

                {/* Reviews list */}
                <div className="reviews-list">
                  {product.reviews?.length === 0
                    ? <p style={{ color: 'var(--gray)', fontSize: 14 }}>No reviews yet. Be the first to review!</p>
                    : product.reviews?.map((r, i) => (
                      <div key={i} className="review-item-card">
                        <div className="review-header">
                          <div className="reviewer-avatar-sm">{r.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Stars n={r.rating} size={12} />
                              {r.verified && <span className="verified-badge">✓ Verified</span>}
                              <span style={{ fontSize: 11, color: 'var(--gray)' }}>{fmtDate(r.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && <p className="review-comment">"{r.comment}"</p>}
                      </div>
                    ))
                  }
                </div>

                {/* Write review form */}
                {isLoggedIn() && (
                  <div className="write-review">
                    <h4>Write a Review</h4>
                    <form onSubmit={handleSubmitReview}>
                      <div className="star-picker">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                            style={{ fontSize: 24, color: n <= reviewForm.rating ? '#f59e0b' : '#e2e8f0', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>
                            ★
                          </button>
                        ))}
                        <span style={{ fontSize: 13, color: 'var(--gray)', marginLeft: 8 }}>{reviewForm.rating}/5</span>
                      </div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={3}
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginTop: 10 }}
                      />
                      <button type="submit" className="btn-primary" style={{ marginTop: 12 }} disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}
                {!isLoggedIn() && (
                  <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 16 }}>
                    <Link to="/login" style={{ color: 'var(--black)', fontWeight: 700 }}>Login</Link> to write a review
                  </p>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="tab-pane">
                <div className="shipping-info">
                  {[
                    { icon: 'fa-truck', title: 'Free Shipping', desc: 'On all orders above ₹999. Standard shipping ₹99 for orders below.' },
                    { icon: 'fa-clock', title: 'Delivery Time', desc: 'Ships within 48 hours. Delivered in 3-7 business days.' },
                    { icon: 'fa-undo', title: '7-Day Returns', desc: 'Easy returns within 7 days of delivery. Item must be unused with tags.' },
                    { icon: 'fa-rupee-sign', title: 'Refund Policy', desc: 'Refunds processed within 5-7 business days to original payment method.' },
                  ].map(s => (
                    <div key={s.title} className="shipping-item">
                      <i className={`fa ${s.icon}`} />
                      <div>
                        <strong>{s.title}</strong>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {related.length > 0 && (
          <div className="related-products">
            <div className="section-header">
              <h2>You May Also Like</h2>
              <Link to={`/shop?category=${product.category}`} className="view-all">
                View All <i className="fa fa-arrow-right" />
              </Link>
            </div>
            <div className="products-grid">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
