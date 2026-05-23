import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { BRAND } from '../../utils/brand'
import Logo from '../Logo'
import api from '../../utils/api'
import './Navbar.css'

const NAV_ITEMS = [
  {
    label: 'WOMEN', dropdown: [
      { title: 'Tops', links: [
        ['Crop Tees',     '/shop?category=women&search=crop'],
        ['Oversized Tees','/shop?category=women&search=oversized'],
        ['Hoodies',       '/shop?category=women&search=hoodie'],
        ['Sweatshirts',   '/shop?category=women&search=sweatshirt'],
      ]},
      { title: 'Bottoms', links: [
        ['Joggers', '/shop?category=women&search=jogger'],
        ['Shorts',  '/shop?category=women&search=shorts'],
        ['Co-ords', '/shop?category=women&search=co-ord'],
      ]},
      { title: 'Collections', links: [
        ['Summer Society',  '/shop?category=women&collection=summer'],
        ['Elevated Basics', '/shop?category=women&collection=basics'],
        ['New Arrivals',    '/shop?category=women&tag=new'],
      ]},
    ]
  },
  {
    label: 'MEN', dropdown: [
      { title: 'Tops', links: [
        ['T-Shirts',       '/shop?category=men&search=tee'],
        ['Oversized Tees', '/shop?category=men&search=oversized'],
        ['Hoodies',        '/shop?category=men&search=hoodie'],
        ['Sweatshirts',    '/shop?category=men&search=sweatshirt'],
      ]},
      { title: 'Bottoms', links: [
        ['Joggers',     '/shop?category=men&search=jogger'],
        ['Shorts',      '/shop?category=men&search=shorts'],
        ['Cargo Pants', '/shop?category=men&search=cargo'],
      ]},
      { title: 'Collections', links: [
        ['Drift 2.0',       '/shop?category=men&collection=drift'],
        ['Elevated Basics', '/shop?category=men&collection=basics'],
        ['New Arrivals',    '/shop?category=men&tag=new'],
      ]},
    ]
  },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount, setIsOpen } = useCart()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products?search=${encodeURIComponent(q)}&limit=5`)
        setSuggestions(data.products || [])
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
    }, 300)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSuggestions(false)
    }
  }

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="header-inner">
          {/* LEFT */}
          <div className="header-left">
            <button className={`hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              <span /><span /><span />
            </button>
            <nav className={`nav${mobileOpen ? ' open' : ''}`}>
              <ul className="nav-list">
                {NAV_ITEMS.map(item => (
                  <li key={item.label} className={`nav-item${item.dropdown ? ' has-dropdown' : ''}${item.sale ? ' sale-link' : ''}`}>
                    {item.href
                      ? <Link to={item.href} onClick={() => setMobileOpen(false)}>{item.label}</Link>
                      : <a href="#">{item.label} {item.dropdown && <i className="fa fa-chevron-down" />}</a>
                    }
                    {item.dropdown && (
                      <div className="dropdown">
                        {item.dropdown.map(col => (
                          <div key={col.title} className="dropdown-col">
                            <h4>{col.title}</h4>
                            {col.links.map(([label, href]) => (
                              <Link key={label} to={href} onClick={() => setMobileOpen(false)}>{label}</Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* CENTER */}
          <Logo size="md" />

          {/* RIGHT */}
          <div className="header-right">
            <div className="header-search" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                  autoComplete="off"
                />
                <button type="submit" aria-label="Search"><i className="fa fa-search" /></button>
              </form>
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map(p => (
                    <div key={p._id} className="suggestion-item" onMouseDown={() => { navigate(`/product/${p.productId}`); setShowSuggestions(false); setSearchQuery('') }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} />
                        : <div className="sug-img-placeholder"><i className="fa fa-tshirt" /></div>
                      }
                      <div>
                        <div className="sug-name">{p.name}</div>
                        <div className="sug-price">₹{p.price?.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                  <div className="suggestion-all" onMouseDown={handleSearchSubmit}>See all results for "{searchQuery}"</div>
                </div>
              )}
            </div>

            <Link to="/account" className="icon-btn" aria-label="Account" title={user ? `Hi, ${user.firstName}` : 'Login'}>
              <i className="fa fa-user" />
              {user && <span className="user-name-badge">{user.firstName}</span>}
            </Link>
            <Link to="/wishlist" className="icon-btn" aria-label="Wishlist"><i className="fa fa-heart" /></Link>
            {isAdmin() && (
              <Link to="/admin" className="icon-btn" aria-label="Admin" title="Admin Panel"><i className="fa fa-shield-alt" /></Link>
            )}
            <button className="icon-btn cart-btn" onClick={() => setIsOpen(true)} aria-label="Cart">
              <i className="fa fa-shopping-bag" />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <div className="mobile-overlay open" onClick={() => setMobileOpen(false)} />}
    </>
  )
}
