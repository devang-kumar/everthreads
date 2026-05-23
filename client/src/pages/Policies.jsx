import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { BRAND } from '../utils/brand'
import './Policies.css'

export default function Policies() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [hash])

  return (
    <div className="policies-page">
      <div className="policies-hero">
        <div className="container">
          <p className="policies-eyebrow">Legal & Policies</p>
          <h1>Our Policies</h1>
          <p>Transparency is part of who we are. Read our policies below.</p>
        </div>
      </div>

      <div className="container">
        <div className="policies-layout">
          {/* Sidebar nav */}
          <aside className="policies-nav">
            <div className="policies-nav-inner">
              <p className="policies-nav-title">Jump to</p>
              <a href="#shipping" className="policies-nav-link">Shipping Policy</a>
              <a href="#returns" className="policies-nav-link">Returns & Cancellation</a>
              <a href="#privacy" className="policies-nav-link">Privacy Policy</a>
              <div className="policies-nav-divider" />
              <a href={`mailto:${BRAND.email}`} className="policies-nav-link contact-link">
                <i className="fa fa-envelope" /> Contact Us
              </a>
              <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="policies-nav-link contact-link">
                <i className="fab fa-instagram" /> {BRAND.instagram}
              </a>
            </div>
          </aside>

          {/* Content */}
          <div className="policies-content">

            {/* ── SHIPPING ── */}
            <section id="shipping" className="policy-section">
              <div className="policy-header">
                <div className="policy-icon"><i className="fa fa-truck" /></div>
                <div>
                  <h2>Shipping Policy</h2>
                  <p className="policy-updated">Everthreads — everthreads.in</p>
                </div>
              </div>

              <div className="policy-intro">
                At Everthreads, we know every order means more than just clothing. It's a piece of your identity, your creativity, your late-night ideas, your story. Every order is packed carefully and shipped with intention — from one creator to another.
              </div>

              <div className="policy-block">
                <h3>Processing Time</h3>
                <p>Orders are usually processed within <strong>2–5 business days</strong> after payment confirmation. Since some drops are produced in limited quantities, processing times may slightly vary during launches and high-demand periods.</p>
              </div>

              <div className="policy-block">
                <h3>Delivery Timeline</h3>
                <p>Estimated delivery time:</p>
                <div className="policy-table">
                  <div className="policy-table-row header">
                    <span>Location</span>
                    <span>Estimated Time</span>
                  </div>
                  <div className="policy-table-row">
                    <span>Metro Cities</span>
                    <span>3–7 business days</span>
                  </div>
                  <div className="policy-table-row">
                    <span>Other Locations</span>
                    <span>5–10 business days</span>
                  </div>
                </div>
                <p style={{ marginTop: 12 }}>We currently deliver across <strong>India</strong>.</p>
              </div>

              <div className="policy-block">
                <h3>Order Tracking</h3>
                <p>Once your order is shipped, tracking details will be shared via <strong>SMS, WhatsApp, or email</strong>.</p>
              </div>

              <div className="policy-block">
                <h3>Address Details</h3>
                <p>Please make sure your shipping details are entered correctly while placing your order. Everthreads won't be responsible for delivery issues caused by incorrect information.</p>
              </div>

              <div className="policy-block">
                <h3>Delays</h3>
                <p>Creators know good things take time. Occasionally, delays may happen due to courier operations, weather conditions, or high volume drops. If that happens, we'll always try to keep you updated.</p>
              </div>

              <div className="policy-contact">
                <p>Need Help?</p>
                <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" /> {BRAND.instagram}</a>
                <a href={`tel:${BRAND.phone1}`}><i className="fa fa-phone" /> {BRAND.phone1}</a>
              </div>
            </section>

            <div className="policy-divider" />

            {/* ── RETURNS ── */}
            <section id="returns" className="policy-section">
              <div className="policy-header">
                <div className="policy-icon"><i className="fa fa-undo" /></div>
                <div>
                  <h2>Return & Cancellation Policy</h2>
                  <p className="policy-updated">Everthreads — everthreads.in</p>
                </div>
              </div>

              <div className="policy-intro">
                Everthreads is built around limited drops, intentional production, and creator-first quality. To avoid unnecessary waste and overproduction, every order is handled carefully and produced in limited quantities.
              </div>

              <div className="policy-block policy-alert">
                <h3><i className="fa fa-exclamation-circle" /> No Cancellation</h3>
                <p>Once an order is placed, it <strong>cannot be canceled</strong>.</p>
              </div>

              <div className="policy-block policy-alert">
                <h3><i className="fa fa-times-circle" /> No Return / Exchange</h3>
                <p>At the moment, we do not offer returns or exchanges after delivery.</p>
                <p>Before placing your order, we recommend checking:</p>
                <ul className="policy-list">
                  <li>Size details</li>
                  <li>Product information</li>
                  <li>Design previews carefully</li>
                </ul>
              </div>

              <div className="policy-block policy-exception">
                <h3><i className="fa fa-shield-alt" /> If Something Goes Wrong</h3>
                <p>If you receive:</p>
                <ul className="policy-list">
                  <li>A damaged product</li>
                  <li>A defective item</li>
                  <li>The wrong product</li>
                </ul>
                <p>Please contact us within <strong>48 hours of delivery</strong> with:</p>
                <ul className="policy-list">
                  <li>Your order number</li>
                  <li>An unboxing video</li>
                  <li>Clear images of the issue</li>
                </ul>
                <p>After verification, our team will help resolve the issue as quickly as possible.</p>
              </div>

              <div className="policy-block">
                <h3>Limited Production Philosophy</h3>
                <p>We don't believe in mass-produced fashion. Every Everthreads drop is created in limited runs for creators who connect with the story behind it.</p>
              </div>

              <div className="policy-contact">
                <p>Contact</p>
                <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" /> {BRAND.instagram}</a>
                <a href={`tel:${BRAND.phone1}`}><i className="fa fa-phone" /> {BRAND.phone1}</a>
              </div>
            </section>

            <div className="policy-divider" />

            {/* ── PRIVACY ── */}
            <section id="privacy" className="policy-section">
              <div className="policy-header">
                <div className="policy-icon"><i className="fa fa-shield-alt" /></div>
                <div>
                  <h2>Privacy Policy</h2>
                  <p className="policy-updated">Everthreads — everthreads.in</p>
                </div>
              </div>

              <div className="policy-intro">
                Your trust matters to us. At Everthreads, we respect the people who support the brand and become part of the creator community. We only collect the information necessary to process your orders and improve your experience.
              </div>

              <div className="policy-block">
                <h3>Information We Collect</h3>
                <p>We may collect:</p>
                <ul className="policy-list">
                  <li>Your name</li>
                  <li>Contact number</li>
                  <li>Email address</li>
                  <li>Shipping address</li>
                  <li>Order details</li>
                </ul>
                <p style={{ marginTop: 12 }}>Payments are securely processed through trusted payment gateways. Everthreads does not store your card or banking details directly.</p>
              </div>

              <div className="policy-block">
                <h3>Why We Use Your Information</h3>
                <p>Your information helps us:</p>
                <ul className="policy-list">
                  <li>Process and deliver orders</li>
                  <li>Provide customer support</li>
                  <li>Send tracking updates</li>
                  <li>Improve the website experience</li>
                  <li>Inform you about future drops and updates</li>
                </ul>
              </div>

              <div className="policy-block">
                <h3>Data Protection</h3>
                <p>Your information stays protected and confidential. We do not sell or misuse customer data.</p>
              </div>

              <div className="policy-block">
                <h3>Cookies</h3>
                <p>Our website may use cookies to improve performance and create a smoother browsing experience.</p>
              </div>

              <div className="policy-block">
                <h3>Policy Updates</h3>
                <p>As Everthreads evolves, this policy may occasionally be updated to reflect changes in our services or operations.</p>
              </div>

              <div className="policy-contact">
                <p>Questions?</p>
                <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" /> {BRAND.instagram}</a>
                <a href={`tel:${BRAND.phone1}`}><i className="fa fa-phone" /> {BRAND.phone1}</a>
              </div>

              <div className="policy-closing">
                From one creator to another — thank you for being here.
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
