import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import CartSidebar from '../cart/CartSidebar'
import AnnouncementBar from './AnnouncementBar'
import BrandStory from './BrandStory'

// Pages where we don't show the brand story section
const NO_BRAND_STORY = ['/login', '/register', '/checkout', '/admin']

export default function Layout() {
  const { pathname } = useLocation()
  const showBrandStory = !NO_BRAND_STORY.some(p => pathname.startsWith(p))

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <CartSidebar />
      <main>
        <Outlet />
      </main>
      {showBrandStory && <BrandStory />}
      <Footer />
    </>
  )
}
