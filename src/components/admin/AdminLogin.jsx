import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import * as OTPAuth from 'otpauth'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  
  // TOTP states
  const [totpCode, setTotpCode] = useState('')
  const [showTotpInput, setShowTotpInput] = useState(false)
  const [adminData, setAdminData] = useState(null)
  const [tempUser, setTempUser] = useState(null)
  const [totpSecret, setTotpSecret] = useState('')
  const [totpTimeRemaining, setTotpTimeRemaining] = useState(30)

  // Load stored attempts from localStorage
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message)
    }

    const storedAttempts = localStorage.getItem('admin_login_attempts')
    if (storedAttempts) {
      try {
        const data = JSON.parse(storedAttempts)
        if (data.email === email && data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
          setLockedUntil(new Date(data.lockedUntil))
          setAttempts(data.count || 0)
        }
      } catch (e) {
        // ignore
      }
    }
  }, [location.state, email])

  // TOTP timer - shows remaining seconds
  useEffect(() => {
    if (!showTotpInput) return

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const period = 30
      const elapsed = now % period
      const remaining = period - elapsed
      setTotpTimeRemaining(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [showTotpInput])

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Validate password strength (minimum 8 characters)
  const isValidPassword = (password) => {
    return password.length >= 8
  }

  // Handle failed attempts
  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (newAttempts >= 3) {
      const lockTime = new Date(Date.now() + 15 * 60 * 1000)
      setLockedUntil(lockTime)
      
      localStorage.setItem('admin_login_attempts', JSON.stringify({
        email: email,
        count: newAttempts,
        lockedUntil: lockTime.toISOString()
      }))

      toast.error('Too many failed attempts. Please try again in 15 minutes.')
      return true
    }

    localStorage.setItem('admin_login_attempts', JSON.stringify({
      email: email,
      count: newAttempts,
      lockedUntil: lockedUntil
    }))

    return false
  }

  // Reset attempts on successful login
  const resetAttempts = () => {
    setAttempts(0)
    setLockedUntil(null)
    localStorage.removeItem('admin_login_attempts')
  }

  // Check if account is locked
  const isLocked = () => {
    if (!lockedUntil) return false
    return new Date(lockedUntil) > new Date()
  }

  // Step 1: Validate credentials and check TOTP
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!isValidPassword(password)) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (isLocked()) {
      const remaining = Math.ceil((new Date(lockedUntil) - new Date()) / 60000)
      toast.error(`Too many failed attempts. Please try again in ${remaining} minutes.`)
      return
    }

    setLoading(true)

    try {
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (error) {
        console.error('Login error:', error)
        
        if (error.message.includes('Invalid login credentials')) {
          const isLocked = handleFailedAttempt()
          if (!isLocked) {
            const remaining = 3 - (attempts + 1)
            toast.error(`Invalid credentials. ${remaining} attempts remaining.`)
          }
        } else {
          toast.error('Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      // ✅ Check if user exists in admin_users - use maybeSingle() to avoid 406 errors
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, full_name, role, status, totp_enabled, totp_secret')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      console.log('🔍 Admin data from database:', adminData)
      
      if (adminError) {
        console.error('Admin query error:', adminError)
        await supabase.auth.signOut()
        toast.error('Access Denied')
        setLoading(false)
        return
      }

      if (!adminData) {
        await supabase.auth.signOut()
        toast.error('Access Denied')
        setLoading(false)
        return
      }

      // Check if admin is active
      if (adminData.status !== 'active') {
        await supabase.auth.signOut()
        toast.error('Account is not active. Please contact support.')
        setLoading(false)
        return
      }

      // Check if user has admin role
      if (!['admin', 'super_admin'].includes(adminData.role)) {
        await supabase.auth.signOut()
        toast.error('Access Denied')
        setLoading(false)
        return
      }

      // ✅ Check if TOTP is enabled
      const isTotpEnabled = adminData.totp_enabled === true || adminData.totp_enabled === 'true'
      
      console.log('🔐 TOTP enabled?', isTotpEnabled)
      console.log('🔐 Raw value:', adminData.totp_enabled)

      if (isTotpEnabled && adminData.totp_secret) {
        console.log('🔐 TOTP is enabled, showing 2FA input')
        setShowTotpInput(true)
        setAdminData(adminData)
        setTotpSecret(adminData.totp_secret)
        setTempUser(data.user)
        setLoading(false)
        
        toast.success('Please enter your authenticator code', {
          icon: '🔐',
          duration: 5000,
        })
        return
      }

      // No TOTP enabled - complete login
      console.log('✅ No TOTP enabled, completing login')
      await completeLogin(adminData, data.user)

    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify TOTP code
  const handleVerifyTotp = async (e) => {
    e.preventDefault()
    
    if (!totpCode || totpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)

    try {
      console.log('🔐 Verifying TOTP code...')
      console.log('Secret:', totpSecret)
      
      if (!totpSecret) {
        toast.error('No TOTP secret found. Please contact support.')
        setLoading(false)
        return
      }

      const totp = new OTPAuth.TOTP({
        issuer: 'VectorDDK',
        label: adminData.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: totpSecret
      })

      const delta = totp.validate({ token: totpCode, window: 1 })
      console.log('TOTP validation delta:', delta)

      if (delta === null) {
        const isLocked = handleFailedAttempt()
        if (!isLocked) {
          toast.error('Invalid authenticator code. Please try again.')
        }
        setLoading(false)
        return
      }

      console.log('✅ TOTP verified successfully!')
      await completeLogin(adminData, tempUser)

    } catch (error) {
      console.error('TOTP verification error:', error)
      toast.error('Failed to verify authenticator code')
    } finally {
      setLoading(false)
    }
  }

  const completeLogin = async (adminData, user) => {
    console.log('✅ Completing login for:', adminData.email)
    
    resetAttempts()

    await supabase
      .from('admin_users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', adminData.id)

    try {
      await supabase
        .from('audit_logs')
        .insert([{
          admin_id: adminData.id,
          admin_email: adminData.email,
          action: 'admin_login',
          target_type: 'admin',
          target_id: adminData.id,
          details: { 
            email: user.email,
            timestamp: new Date().toISOString(),
            method: adminData.totp_enabled ? 'password + totp' : 'password'
          },
          user_agent: navigator.userAgent
        }])
    } catch (logError) {
      console.warn('Audit log error:', logError)
    }

    toast.success(`Welcome back, ${adminData.full_name || 'Admin'}!`)
    navigate('/admin/dashboard')
  }

  // Render TOTP form
  if (showTotpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => {
                setShowTotpInput(false)
                setTotpCode('')
                supabase.auth.signOut()
              }}
              className="float-left text-[#555555] hover:text-[#111111] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#111111]">2-Step Verification</h1>
            <p className="text-[#555555] mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
            <p className="text-xs text-[#555555] mt-2">
              Code expires in <span className="font-mono font-bold">{totpTimeRemaining}s</span>
            </p>
          </div>

          <form onSubmit={handleVerifyTotp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-3 text-center">
                Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 text-center text-3xl tracking-[12px] font-mono border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 transition-colors"
                placeholder="000000"
                autoFocus
                required
              />
              <p className="text-xs text-[#555555] text-center mt-2">
                The code refreshes every 30 seconds
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTotpInput(false)
                setTotpCode('')
                supabase.auth.signOut()
              }}
              className="w-full py-2.5 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded-lg hover:bg-[#F6F6F6] transition-colors"
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Render login form
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-2xl font-bold text-[#111111]">
              Vector<span className="text-[#555555]">DDK</span>
            </span>
            <span className="text-xs text-[#555555] bg-[#F6F6F6] px-2 py-0.5 rounded ml-1">ADMIN</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">Admin Login</h1>
          <p className="text-[#555555] mt-1">Sign in to the VectorDDK admin panel</p>
        </div>

        {isLocked() && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Account Temporarily Locked</p>
              <p className="text-xs text-red-600">
                Too many failed attempts. Please try again in{' '}
                {Math.ceil((new Date(lockedUntil) - new Date()) / 60000)} minutes.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                placeholder="admin@example.com"
                required
                disabled={isLocked()}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                placeholder="Enter your password"
                required
                disabled={isLocked()}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isLocked()}
            className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-[#E5E5E5] text-center">
          <p className="text-xs text-[#555555]">
            Admin accounts are created by the system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin