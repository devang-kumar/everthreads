import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import ProductCard from '../components/product/ProductCard'
import './Shop.css'

export default function Wishlist() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true)
      const ids = JSON.parse(localStorage.getItem('bc_wishlist') || '[]')
      if (!ids.length) { setProducts([]); setLoading(false); return }
      try {
        const results = await Promise.all(ids.map(id => api.get(`/products/${id}`).then(r => r.data.product).catch(() => null)))
        setProducts(results.filter(Boolean))
      } catch { setProducts([]) }
      setLoading(false)
    }
    fetchWishlist()
  }, [])

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="container">
          <h1>My Wishlist</h1>
          <p>{products.length} saved items</p>
        </div>
      </div>
      <div className="container">
        {loading ? (
          <div className="products-grid">
            {Array(4).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty">
            <i className="fa fa-heart" />
            <h3>Your wishlist is empty</h3>
            <p>Save items you love by clicking the heart icon</p>
            <Link to="/shop" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
