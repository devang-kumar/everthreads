import { Link } from 'react-router-dom'
import { BRAND } from '../../utils/brand'
import Logo from '../Logo'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-brand-col">
            <Logo size="md" dark />
            <p className="footer-tagline">"{BRAND.motto}"</p>
            <p className="footer-desc">{BRAND.description}</p>
            <Link to="/about" className="footer-story-link">
              <span>Read Our Story</span>
              <i className="fa fa-arrow-right" />
            </Link>
            <div className="footer-socials">
              <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
                <i className="fab fa-instagram" />
              </a>
              <a href={`mailto:${BRAND.email}`} aria-label="Email" title="Email us">
                <i className="fa fa-envelope" />
              </a>
              <a href={`tel:${BRAND.phone1}`} aria-label="Call us" title="Call us">
                <i className="fa fa-phone" />
              </a>
            </div>
          </div>

          {/* Shop column */}
          <div className="footer-col">
            <h4>SHOP</h4>
            <ul>
              <li><Link to="/shop?category=men">Men</Link></li>
              <li><Link to="/shop?category=women">Women</Link></li>
              <li><Link to="/shop?category=unisex">Unisex</Link></li>
              <li><Link to="/shop?tag=new">New Drops</Link></li>
            </ul>
          </div>

          {/* Help column */}
          <div className="footer-col">
            <h4>HELP</h4>
            <ul>
              <li><Link to="/policies#shipping">Shipping Policy</Link></li>
              <li><Link to="/policies#returns">Returns & Cancellation</Link></li>
              <li><Link to="/policies#privacy">Privacy Policy</Link></li>
              <li><Link to="/account">Track Order</Link></li>
              <li><a href={`mailto:${BRAND.email}`}>Contact Us</a></li>
            </ul>
          </div>

          {/* Contact column */}
          <div className="footer-col">
            <h4>CONTACT</h4>
            <ul>
              <li>
                <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram" /> {BRAND.instagram}
                </a>
              </li>
              <li>
                <a href={`mailto:${BRAND.email}`}>
                  <i className="fa fa-envelope" /> {BRAND.email}
                </a>
              </li>
              <li>
                <a href={`tel:${BRAND.phone1}`}>
                  <i className="fa fa-phone" /> {BRAND.phone1}
                </a>
              </li>
              <li>
                <a href={`tel:${BRAND.phone2}`}>
                  <i className="fa fa-phone" /> {BRAND.phone2}
                </a>
              </li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/policies">Policies</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {BRAND.year} {BRAND.name}. All rights reserved. Built in India for creators.</p>
          <div className="footer-payment-icons">
            <i className="fab fa-cc-visa" title="Visa" />
            <i className="fab fa-cc-mastercard" title="Mastercard" />
            <i className="fab fa-google-pay" title="Google Pay" />
            <i className="fa fa-university" title="Net Banking" />
          </div>
        </div>
      </div>
    </footer>
  )
}
