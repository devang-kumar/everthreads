import './AnnouncementBar.css'

const messages = [
  '🚚 FREE SHIPPING ON ORDERS ABOVE ₹999',
  '✦ FOR CREATORS. BY CREATORS.',
  '📦 SHIPS WITHIN 2–5 BUSINESS DAYS',
  '🎁 USE CODE WELCOME15 FOR 15% OFF YOUR FIRST ORDER',
  '🇮🇳 BUILT IN INDIA',
  '✦ WEAR YOUR STORY.',
  '💳 EXTRA 5% OFF ON PREPAID ORDERS',
  '📸 TAG US @EVERTHREADS.IN',
]

export default function AnnouncementBar() {
  const track = [...messages, ...messages]
  return (
    <div className="announcement-bar">
      <div className="announcement-track">
        {track.map((msg, i) => (
          <span key={i}>{msg}&nbsp;&nbsp;•&nbsp;&nbsp;</span>
        ))}
      </div>
    </div>
  )
}
