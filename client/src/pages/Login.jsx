import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // Login
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Register
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(loginForm.email, loginForm.password)
      if (res.success) {
        toast.success('Welcome back! 👋')
        navigate(res.user?.role === 'admin' ? '/admin' : '/')
      } else {
        toast.error(res.message || 'Invalid credentials')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (regForm.password !== regForm.confirm) { toast.error('Passwords do not match'); return }
    if (regForm.password.length < 6) { toast.error('Min 6 characters required'); return }
    setLoading(true)
    try {
      const { confirm, ...payload } = regForm
      const res = await register(payload)
      if (res.success) {
        toast.success('Account created! Welcome 🎉')
        navigate('/')
      } else {
        toast.error(res.message || 'Registration failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      {/* Page title */}
      <div className="auth-page-logo">
        <Logo size="lg" />
      </div>
      <p className="auth-page-title">
        {tab === 'login' ? 'Login with Everthreads' : 'Create your Everthreads account'}
      </p>

      <div className="auth-card">
        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => setTab('login')}
          >
            LOGIN
          </button>
          <button
            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => setTab('register')}
          >
            REGISTER
          </button>
        </div>

        {/* Tab arrow indicator */}
        <div className={`auth-tab-arrow ${tab}`} />

        {/* Form body */}
        <div className="auth-body">

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-input-wrap">
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-input-wrap pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)}>
                  <i className={`fa fa-eye${showPw ? '-slash' : ''}`} />
                </button>
              </div>

              <button type="submit" className="auth-proceed-btn" disabled={loading}>
                {loading ? <><i className="fa fa-spinner fa-spin" /> Please wait...</> : 'PROCEED'}
              </button>

              <p className="auth-switch-line">
                New User? <button type="button" className="auth-link" onClick={() => setTab('register')}>Create Account</button>
              </p>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-input-row-2">
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={regForm.firstName}
                    onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={regForm.lastName}
                    onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="auth-input-wrap">
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  value={regForm.email}
                  onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-input-wrap">
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={regForm.phone}
                  onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="auth-input-wrap pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create Password (min 6 chars)"
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)}>
                  <i className={`fa fa-eye${showPw ? '-slash' : ''}`} />
                </button>
              </div>
              <div className="auth-input-wrap">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={regForm.confirm}
                  onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="auth-proceed-btn" disabled={loading}>
                {loading ? <><i className="fa fa-spinner fa-spin" /> Creating...</> : 'CREATE ACCOUNT'}
              </button>

              <p className="auth-switch-line">
                Already have an account? <button type="button" className="auth-link" onClick={() => setTab('login')}>Login</button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Bottom links */}
      <div className="auth-bottom-links">
        <Link to="/">← Back to Store</Link>
        <span>·</span>
        <Link to="/policies#privacy">Privacy Policy</Link>
      </div>
    </div>
  )
}
