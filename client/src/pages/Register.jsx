// Register is now handled inside Login.jsx as a tab
// This file redirects to /login?tab=register
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/login', { replace: true }) }, [])
  return null
}
