import { useState } from 'react'
import { BRAND } from '../../utils/brand'
import toast from 'react-hot-toast'
import './BrandStory.css'

export default function BrandStory() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    toast.success('Subscribed! 🎉')
    setEmail('')
  }

  return (
    <div className="newsletter-bar">
      <div className="newsletter-bar-inner">
        <div className="newsletter-bar-text">
          <span className="newsletter-bar-title">JOIN THE COMMUNITY</span>
          <span className="newsletter-bar-sub">Early access to drops, exclusive deals & creator stories</span>
        </div>
        <form className="newsletter-bar-form" onSubmit={handleSubscribe}>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">SUBSCRIBE</button>
        </form>
      </div>
    </div>
  )
}
