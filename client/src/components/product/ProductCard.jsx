import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { fmt } from '../../utils/format'
import toast from 'react-hot-toast'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [wishlisted, setWishlisted] = useState(() => {
    const wl = JSON.parse(localStorage.getItem('bc_wishlist') || '[]')
    return wl.includes(product.productId)
  })

  const save = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleWishlist = (e) => {
    e.stopPropagation()
    const wl = JSON.parse(localStorage.getItem('bc_wishlist') || '[]')
    const idx = wl.indexOf(product.productId)
    if (idx === -1) { wl.push(product.productId); toast('Added to wishlist ❤️') }
    else { wl.splice(idx, 1); toast('Removed from wishlist') }
    localStorage.setItem('bc_wishlist', JSON.stringify(wl))
    setWishlisted(idx === -1)
  }

  const handleQuickAdd = (e) => {
    e.stopPropagation()
    if (!product.sizes?.length) {
      addToCart(product, 'One Size')
      toast('Added to bag 🛍️')
      return
    }
    setShowSizePicker(true)
  }

  const handleSizePick = (size) => {
    addToCart(product, size)
    toast(`Added to bag 🛍️`)
    setShowSizePicker(false)
  }

  return (
    <>
      <div className="product-card" onClick={() => navigate(`/product/${product.productId}`)}>
        <div className="product-img-wrap">
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} loading="lazy" />
            : <div className="product-emoji-wrap"><i className="fa fa-tshirt" /></div>
          }
          {product.badge && (
            <span className={`product-badge ${product.badge}`}>{product.badge.toUpperCase()}</span>
          )}
          <button
            className={`product-wishlist${wishlisted ? ' active' : ''}`}
            onClick={handleWishlist}
            aria-label="Wishlist"
          >
            <i className={`fa${wishlisted ? 's' : 'r'} fa-heart`} />
          </button>
          <button className="product-quick-add" onClick={handleQuickAdd}>
            Quick Add +
          </button>
        </div>
        <div className="product-info">
          <h3>{product.name}</h3>
          <div className="product-price">
            <span className="price-current">{fmt(product.price)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="price-original">{fmt(product.originalPrice)}</span>
                <span className="price-save">Save {save}%</span>
              </>
            )}
          </div>
          {product.colors?.length > 0 && (
            <div className="product-colors">
              {product.colors.slice(0, 5).map(c => (
                <span key={c} className="color-dot" style={{ background: c }} title={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showSizePicker && (
        <div className="size-picker-overlay" onClick={() => setShowSizePicker(false)}>
          <div className="size-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="size-picker-header">
              <span>Select Size — {product.name}</span>
              <button onClick={() => setShowSizePicker(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="size-picker-options">
              {product.sizes?.map(size => (
                <button key={size} className="size-pick-btn" onClick={() => handleSizePick(size)}>{size}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
