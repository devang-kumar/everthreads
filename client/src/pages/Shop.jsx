import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import ProductCard from '../components/product/ProductCard'
import './Shop.css'

const CATEGORIES = ['all', 'men', 'women', 'unisex', 'accessories']
const SORT_OPTIONS = [
  { value: '',          label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high',label: 'Price: High to Low' },
  { value: 'newest',    label: 'Newest First' },
  { value: 'discount',  label: 'Best Discount' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Read all filters from URL — support both 'search' and 'q' params
  const category   = searchParams.get('category')   || ''
  const search     = searchParams.get('search') || searchParams.get('q') || ''
  const sort       = searchParams.get('sort')       || ''
  const tag        = searchParams.get('tag')        || ''
  const collection = searchParams.get('collection') || ''

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1)
  }, [category, search, sort, tag, collection])

  // Fetch products whenever filters or page change
  useEffect(() => {
    let cancelled = false
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page, limit: 12 })
        if (category)   params.set('category',   category)
        if (search)     params.set('search',      search)
        if (sort)       params.set('sort',        sort)
        if (tag)        params.set('tag',         tag)
        if (collection) params.set('collection',  collection)
        const { data } = await api.get(`/products?${params}`)
        if (!cancelled) {
          setProducts(data.products || [])
          setTotal(data.total || 0)
        }
      } catch {
        if (!cancelled) setProducts([])
      }
      if (!cancelled) setLoading(false)
    }
    fetchProducts()
    return () => { cancelled = true }
  }, [category, search, sort, tag, collection, page])

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    setSearchParams(p)
  }

  const pages = Math.ceil(total / 12)

  const pageTitle = search
    ? `Search: "${search}"`
    : category
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : tag === 'new' ? 'New Arrivals'
      : tag === 'trending' ? 'Trending'
      : collection ? collection.charAt(0).toUpperCase() + collection.slice(1)
      : 'All Products'

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="container">
          <h1>{pageTitle}</h1>
          <p>{loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''}`}</p>
        </div>
      </div>

      <div className="container">
        <div className="shop-toolbar">
          <div className="shop-cats">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`cat-btn${(category === c || (!category && c === 'all')) ? ' active' : ''}`}
                onClick={() => setFilter('category', c === 'all' ? '' : c)}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <div className="shop-sort">
            <label>Sort by:</label>
            <select value={sort} onChange={e => setFilter('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array(12).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty">
            <i className="fa fa-search" />
            <h3>No products found</h3>
            <p>Try adjusting your filters or search term</p>
            <button className="btn-primary" onClick={() => setSearchParams({})}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
            {pages > 1 && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="page-btn">
                  <i className="fa fa-chevron-left" />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="page-btn">
                  <i className="fa fa-chevron-right" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
