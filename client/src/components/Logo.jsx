import { Link } from 'react-router-dom'
import './Logo.css'

/**
 * EverThreads logo — matches the brand image:
 * "Ever" in cursive script + "Threads" in bold sans-serif + ™
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   dark: bool — white version for dark backgrounds (default: false)
 *   noLink: bool — render as div instead of Link
 */
export default function Logo({ size = 'md', dark = false, noLink = false }) {
  const content = (
    <span className={`et-logo et-logo--${size}${dark ? ' et-logo--dark' : ''}`}>
      <img src={dark ? "/logo_dark_v5.png" : "/logo_v5.png"} alt="EverThreads" className="et-logo-image" />
    </span>
  )

  if (noLink) return content
  return <Link to="/" className="et-logo-link">{content}</Link>
}
