import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import ProductCard from '../components/product/ProductCard'
import Logo from '../components/Logo'
import './Home.css'
import './HomeBrandBanner.css'

const SLIDES = [
  {
    tag: 'FOR CREATORS. BY CREATORS.',
    title: "WEAR YOUR\nSTORY.",
    sub: 'Story-driven clothing for the generation that creates.',
    bg: 'slide-bg-1',
    cta: 'SHOP NOW',
    cta2: 'OUR STORY',
    cta2Link: '/about'
  },
  {
    tag: 'NEW DROP',
    title: "SUMMER\nSOCIETY\nIS HERE",
    sub: 'The season\'s most wanted pieces — limited run.',
    bg: 'slide-bg-2',
    cta: 'SHOP SUMMER SOCIETY',
    cta2: 'EXPLORE ALL'
  },
  {
    tag: 'BUILT IN INDIA',
    title: "DRIFT\n2.0\nIS HERE",
    sub: 'Speed-inspired streetwear for the fearless creator.',
    bg: 'slide-bg-3',
    cta: 'SHOP DRIFT 2.0',
    cta2: 'SEE THE STORY'
  },
]

const TESTIMONIALS = [
  { text: '"It was so much more worthy than buying a ₹1400 t-shirt from H&M or Zara. The quality was better and the aesthetic was on point!"', name: 'Saumya Raj', initial: 'S' },
  { text: '"The quality is premium and I bought XS and it fits me best. I\'ve been dying to get a Billie Eilish tee in India — you can surely go for this one!"', name: 'Ansh Jadli', initial: 'A' },
  { text: '"Change your name to quality.com — I swear I lovedddddddd the quality so so so much. Thanks EVERTHREAD!"', name: 'Riya Sharma', initial: 'R' },
  { text: '"The packaging was eco-friendly, no plastic, and the tag on the tee had a quote too. Absolutely loved the whole experience!"', name: 'Karan Mehta', initial: 'K' },
]

export default function Home() {
  const [slide, setSlide] = useState(0)
  const [testimonial, setTestimonial] = useState(0)
  const [newArrivals, setNewArrivals] = useState([])
  const [trending, setTrending] = useState([])
  const [basics, setBasics] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [filteredNew, setFilteredNew] = useState([])
  const [email, setEmail] = useState('')
  const slideTimer = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [newRes, trendRes, basicsRes] = await Promise.all([
          api.get('/products?tag=new&limit=8'),
          api.get('/products?tag=trending&limit=4'),
          api.get('/products?collection=basics&limit=4'),
        ])
        setNewArrivals(newRes.data.products || [])
        setFilteredNew(newRes.data.products || [])
        setTrending(trendRes.data.products || [])
        setBasics(basicsRes.data.products || [])
      } catch (e) {
        // fallback: load all products
        try {
          const res = await api.get('/products?limit=16')
          const all = res.data.products || []
          setNewArrivals(all.slice(0, 8))
          setFilteredNew(all.slice(0, 8))
          setTrending(all.slice(0, 4))
          setBasics(all.slice(4, 8))
        } catch {}
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    slideTimer.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 2500)
    return () => clearInterval(slideTimer.current)
  }, [])

  const goSlide = (i) => { setSlide(i); clearInterval(slideTimer.current); slideTimer.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 2500) }

  const handleFilter = (f) => {
    setActiveFilter(f)
    if (f === 'all') setFilteredNew(newArrivals)
    else setFilteredNew(newArrivals.filter(p => p.category === f))
  }

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (email) { alert('Thanks for subscribing! 🎉'); setEmail('') }
  }

  return (
    <div className="home">
      {/* Hero Slider */}
      <section className="hero-slider">
        {SLIDES.map((s, i) => (
          <div key={i} className={`slide${slide === i ? ' active' : ''}`}>
            <div className={`slide-bg ${s.bg}`} />
            <div className="slide-content">
              <p className="slide-tag">{s.tag}</p>
              <h1>{s.title.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}</h1>
              <p className="slide-sub">{s.sub}</p>
              <div className="slide-btns">
                <Link to="/shop" className="btn-primary">{s.cta}</Link>
                <Link to={s.cta2Link || '/shop'} className="btn-outline">{s.cta2}</Link>
              </div>
            </div>
          </div>
        ))}
        <div className="slider-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`dot-indicator${slide === i ? ' active' : ''}`}
              onClick={() => goSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            >
              <svg className="dot-svg" viewBox="0 0 24 24">
                <circle className="dot-bg-circle" cx="12" cy="12" r="9" />
                {slide === i && (
                  <circle className="dot-progress-circle" cx="12" cy="12" r="9" />
                )}
              </svg>
              <span className="dot-inner-dot" />
            </button>
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: 'fa-tshirt', title: 'All-Day Comfort Fit', sub: 'Designed for all-day wear' },
              { icon: 'fa-star', title: 'Effortless Fresh Look', sub: 'Style that speaks for itself' },
              { icon: 'fa-ruler', title: 'Easy To Style Silhouettes', sub: 'Versatile fits for every occasion' },
              { icon: 'fa-shipping-fast', title: 'Ships In 48 Hours', sub: 'Fast dispatch, every order' },
            ].map(f => (
              <div key={f.title} className="feature-item">
                <div className="feature-icon"><i className={`fa ${f.icon}`} /></div>
                <div className="feature-text"><h4>{f.title}</h4><p>{f.sub}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>New Arrivals</h2>
            <div className="filter-tabs">
              {['all','men','women','unisex'].map(f => (
                <button key={f} className={`filter-tab${activeFilter === f ? ' active' : ''}`} onClick={() => handleFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Link to="/shop" className="view-all">View All <i className="fa fa-arrow-right" /></Link>
          </div>
          <div className="products-grid">
            {filteredNew.length > 0
              ? filteredNew.map(p => <ProductCard key={p._id} product={p} />)
              : Array(8).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)
            }
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {['FOR CREATORS','✦','BY CREATORS','✦','WEAR YOUR STORY','✦','BUILT IN INDIA','✦','LIMITED DROPS','✦','STORY-DRIVEN DESIGN','✦','FREE SHIPPING ABOVE ₹999','✦',
            'FOR CREATORS','✦','BY CREATORS','✦','WEAR YOUR STORY','✦','BUILT IN INDIA','✦','LIMITED DROPS','✦','STORY-DRIVEN DESIGN','✦','FREE SHIPPING ABOVE ₹999','✦'].map((t, i) => (
            <span key={i}>{t}&nbsp;&nbsp;</span>
          ))}
        </div>
      </div>

      {/* Featured Collections */}
      <section className="featured-collections">
        <div className="container">
          <div className="section-header">
            <h2>EXPLORE COLLECTIONS</h2>
            <Link to="/shop" className="view-all">View All <i className="fa fa-arrow-right" /></Link>
          </div>
          <div className="collection-banners">
            <div className="col-banner large">
              <div className="col-banner-inner" style={{ background: 'linear-gradient(160deg,#0d0d0d,#2d1b69)' }}>
                <div className="col-banner-text">
                  <span className="col-tag">HOT DROP</span>
                  <h3>SUMMER SOCIETY</h3>
                  <p>The season's most wanted pieces</p>
                  <Link to="/shop?collection=summer" className="btn-white">SHOP NOW</Link>
                </div>
                <div className="col-banner-graphic"><div className="graphic-circle purple" /></div>
              </div>
            </div>
            <div className="col-banner-stack">
              <div className="col-banner small">
                <div className="col-banner-inner" style={{ background: 'linear-gradient(160deg,#1a0a00,#8b4513)' }}>
                  <div className="col-banner-text">
                    <span className="col-tag">CELEBRITY EDIT</span>
                    <h3>ANUSHKA'S PICKS</h3>
                    <Link to="/shop" className="btn-white">EXPLORE</Link>
                  </div>
                  <div className="col-banner-graphic"><div className="graphic-circle orange" /></div>
                </div>
              </div>
              <div className="col-banner small">
                <div className="col-banner-inner" style={{ background: 'linear-gradient(160deg,#000814,#003566)' }}>
                  <div className="col-banner-text">
                    <span className="col-tag">NEW COLLECTION</span>
                    <h3>DRIFT 2.0</h3>
                    <Link to="/shop?collection=drift" className="btn-white">EXPLORE</Link>
                  </div>
                  <div className="col-banner-graphic"><div className="graphic-circle blue" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>Trending Now</h2>
            <Link to="/shop?tag=trending" className="view-all">View All <i className="fa fa-arrow-right" /></Link>
          </div>
          <div className="products-grid">
            {trending.length > 0
              ? trending.map(p => <ProductCard key={p._id} product={p} />)
              : Array(4).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)
            }
          </div>
        </div>
      </section>

      {/* Elevated Basics */}
      <section className="products-section" style={{ background: '#f7f7f7' }}>
        <div className="container">
          <div className="section-header">
            <h2>Elevated Basics</h2>
            <p className="section-sub">Essentials Worth Repeating</p>
            <Link to="/shop?collection=basics" className="view-all">View All <i className="fa fa-arrow-right" /></Link>
          </div>
          <div className="products-grid">
            {basics.length > 0
              ? basics.map(p => <ProductCard key={p._id} product={p} />)
              : Array(4).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)
            }
          </div>
        </div>
      </section>

      {/* ── BRAND HERO BANNER — above testimonials ── */}
      <section className="home-brand-banner">
        <div className="home-brand-banner-bg" />
        <div className="home-brand-banner-content">
          <div className="home-brand-logo-wrap">
            <Logo size="xl" dark noLink />
          </div>
          <p className="home-brand-motto">"Wear Your Story."</p>
          <p className="home-brand-sub">Story-driven clothing for the generation that creates.<br />Built in India. Designed for creators.</p>
          <div className="home-brand-btns">
            <Link to="/shop" className="btn-primary">SHOP NOW</Link>
            <Link to="/about" className="btn-outline">OUR STORY</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header centered">
            <h2>What Customers Say</h2>
            <p>Real reviews from real customers</p>
          </div>
          <div className="testimonials-slider">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`testimonial-card${testimonial === i ? ' active' : ''}`}>
                <div className="stars">★★★★★</div>
                <p>{t.text}</p>
                <div className="reviewer">
                  <div className="reviewer-avatar">{t.initial}</div>
                  <div><strong>{t.name}</strong><span>Verified Buyer</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="testimonial-dots">
            {TESTIMONIALS.map((_, i) => (
              <span key={i} className={`dot${testimonial === i ? ' active' : ''}`} onClick={() => setTestimonial(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="instagram-strip">
        <div className="container">
          <div className="section-header centered">
            <h2>@EVERTHREADS.IN</h2>
            <p>Tag us to get featured · <a href="https://instagram.com/everthreads.in" target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent)', fontWeight:700 }}>Follow on Instagram</a></p>
          </div>
          <div className="insta-grid">
            {[
              'linear-gradient(135deg,#2c3e50,#4a6741)',
              'linear-gradient(135deg,#1a0a00,#3d1a00)',
              'linear-gradient(135deg,#000814,#001d3d)',
              'linear-gradient(135deg,#0d0d0d,#2d1b69)',
              'linear-gradient(135deg,#2d1b00,#5c3d11)',
              'linear-gradient(135deg,#0a1628,#1a3a5c)',
            ].map((bg, i) => (
              <a key={i} className="insta-item" href="https://instagram.com/everthreads.in" target="_blank" rel="noopener noreferrer">
                <div className="insta-placeholder" style={{ background: bg }}>
                  <i className="fab fa-instagram" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
