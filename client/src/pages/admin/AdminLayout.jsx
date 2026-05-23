import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import api from '../../utils/api'
import './Admin.css'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: 'fa-chart-line' },
      { to: '/admin/reports', label: 'Reports', icon: 'fa-file-alt' },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: 'fa-tshirt' },
      { to: '/admin/inventory', label: 'Inventory', icon: 'fa-warehouse' },
      { to: '/admin/reviews', label: 'Reviews', icon: 'fa-star' },
    ]
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: 'fa-box' },
      { to: '/admin/returns', label: 'Returns', icon: 'fa-undo' },
      { to: '/admin/coupons', label: 'Coupons', icon: 'fa-tag' },
    ]
  },
  {
    label: 'Customers',
    items: [
      { to: '/admin/customers', label: 'Customers', icon: 'fa-users' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: 'fa-cog' },
      { to: '/admin/audit', label: 'Audit Log', icon: 'fa-history' },
    ]
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    api.get('/admin/notifications').then(r => {
      setUnread(r.data.unread || 0)
      setNotifications(r.data.notifications || [])
    }).catch(() => {})
  }, [])

  const markAllRead = async () => {
    await api.put('/admin/notifications/read-all').catch(() => {})
    setUnread(0)
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
  }

  return (
    <div className={`admin-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Logo size="sm" dark noLink />
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                >
                  <i className={`fa ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div className="admin-user-info">
              <div className="admin-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <div className="admin-sidebar-actions">
            <button onClick={() => navigate('/')} className="admin-action-btn" title="View Store">
              <i className="fa fa-store" />
            </button>
            <button onClick={() => { logout(); navigate('/login') }} className="admin-action-btn" title="Logout">
              <i className="fa fa-sign-out-alt" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-content-wrap">
        {/* Top bar */}
        <header className="admin-topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(s => !s)}>
            <i className="fa fa-bars" />
          </button>
          <div className="topbar-right">
            <div className="notif-wrap">
              <button className="topbar-icon-btn" onClick={() => setShowNotif(s => !s)}>
                <i className="fa fa-bell" />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    {unread > 0 && <button onClick={markAllRead} className="notif-mark-read">Mark all read</button>}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0
                      ? <div className="notif-empty">No notifications</div>
                      : notifications.slice(0, 10).map(n => (
                        <div key={n._id} className={`notif-item${n.isRead ? '' : ' unread'}`}>
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-msg">{n.message}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
            <div className="topbar-user">
              <div className="admin-avatar sm">{user?.firstName?.[0]}</div>
              <span>{user?.firstName}</span>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
