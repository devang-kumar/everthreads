import { Link } from 'react-router-dom'
import { BRAND } from '../utils/brand'
import Logo from '../components/Logo'
import './About.css'

export default function About() {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="about-hero-content">
          <div className="about-hero-logo-wrap"><Logo size="xl" dark noLink /></div>
          <p className="about-eyebrow">Our Story</p>
          <h1>FOR CREATORS.<br />BY CREATORS.</h1>
          <p className="about-hero-sub">Story-driven clothing for the generation that creates.</p>
        </div>
      </section>

      {/* Main story */}
      <section className="about-story">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <h2>What is Everthreads?</h2>
              <p>Everthreads was built for the people creating something of their own.</p>
              <p>For the designers turning ideas into visuals. For the editors working through late nights. For the artists, filmmakers, gamers, photographers, musicians, and dreamers chasing something bigger than themselves.</p>
              <p>But creativity isn't limited to a profession. It's a mindset. A way of thinking differently. A way of expressing who you are.</p>
              <p><strong>That's what Everthreads represents.</strong></p>
            </div>
            <div className="about-story-quote">
              <blockquote>
                "We create story-driven clothing inspired by creative culture, self-expression, and the energy of modern creators."
              </blockquote>
              <div className="about-quote-line" />
              <p>Every drop is designed with intention — carrying its own concept, emotion, and identity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="container">
          <h2 className="about-section-title">What We Stand For</h2>
          <div className="values-grid">
            {[
              { icon: '✦', title: 'Story-Driven Design', desc: 'Every drop carries its own concept, emotion, and identity. We don\'t make clothes — we make statements.' },
              { icon: '◈', title: 'Limited Production', desc: 'We don\'t believe in mass-produced fashion. Every Everthreads drop is created in limited runs for creators who connect with the story behind it.' },
              { icon: '◉', title: 'Creator-First', desc: 'More than fashion, Everthreads is about belonging to a generation that creates, experiments, builds, and inspires.' },
              { icon: '◇', title: 'Built in India', desc: 'Proudly made in India. Designed for creators worldwide. Every stitch carries the spirit of Indian craftsmanship.' },
            ].map(v => (
              <div key={v.title} className="value-card">
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="about-for">
        <div className="container">
          <div className="about-for-inner">
            <h2>This Brand Is For You</h2>
            <p className="about-for-sub">Whether you create art, ideas, businesses, music, content, or your own path —</p>
            <div className="creator-tags">
              {['Designers','Editors','Artists','Filmmakers','Gamers','Photographers','Musicians','Dreamers','Entrepreneurs','Content Creators','Builders','Thinkers'].map(tag => (
                <span key={tag} className="creator-tag">{tag}</span>
              ))}
            </div>
            <p className="about-for-closing">
              Creativity isn't limited to a profession. It's a mindset. A way of thinking differently. A way of expressing who you are.
            </p>
          </div>
        </div>
      </section>

      {/* Motto section */}
      <section className="about-motto">
        <div className="container">
          <div className="motto-text">
            <span className="motto-line">WEAR YOUR STORY.</span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="about-contact">
        <div className="container">
          <h2 className="about-section-title">Get In Touch</h2>
          <div className="contact-grid">
            {[
              { icon: 'fab fa-instagram', label: 'Instagram', value: BRAND.instagram, href: BRAND.instagramUrl },
              { icon: 'fa fa-envelope', label: 'Email', value: BRAND.email, href: `mailto:${BRAND.email}` },
              { icon: 'fa fa-phone', label: 'Phone', value: `${BRAND.phone1} / ${BRAND.phone2}`, href: `tel:${BRAND.phone1}` },
              { icon: 'fa fa-globe', label: 'Website', value: BRAND.domain, href: `https://${BRAND.domain}` },
            ].map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="contact-card">
                <i className={c.icon} />
                <div>
                  <div className="contact-label">{c.label}</div>
                  <div className="contact-value">{c.value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container">
          <h2>Ready to Wear Your Story?</h2>
          <p>Explore our latest drops and find the piece that speaks to you.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn-primary-lg">SHOP NOW</Link>
            <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-outline-lg">
              <i className="fab fa-instagram" /> FOLLOW US
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
