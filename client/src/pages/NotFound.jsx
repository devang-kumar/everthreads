import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '120px', lineHeight: 1, color: '#f0f0f0' }}>404</h1>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, marginBottom: 12 }}>Page Not Found</h2>
      <p style={{ color: 'var(--gray)', marginBottom: 28 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '13px 28px', background: 'var(--black)', color: 'var(--white)', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', border: '2px solid var(--black)' }}>
        Back to Home
      </Link>
    </div>
  )
}
