import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)

  // Set email from registration if provided
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
    }
    if (location.state?.message) {
      toast.success(location.state.message)
    }

    // Load stored attempts from localStorage
    const storedAttempts = localStorage.getItem('login_attempts')
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

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Validate password strength (minimum 6 characters)
  const isValidPassword = (password) => {
    return password.length >= 6
  }

  // Handle failed attempts
  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    // Lock after 5 failed attempts
    if (newAttempts >= 5) {
      const lockTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      setLockedUntil(lockTime)
      
      // Store in localStorage
      localStorage.setItem('login_attempts', JSON.stringify({
        email: email,
        count: newAttempts,
        lockedUntil: lockTime.toISOString()
      }))

      toast.error('Too many failed attempts. Please try again in 15 minutes.')
      return true
    }

    // Update localStorage
    localStorage.setItem('login_attempts', JSON.stringify({
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
    localStorage.removeItem('login_attempts')
  }

  // Check if account is locked
  const isLocked = () => {
    if (!lockedUntil) return false
    return new Date(lockedUntil) > new Date()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 1. Validate email
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!isValidPassword(password)) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // 2. Check if account is locked
    if (isLocked()) {
      const remaining = Math.ceil((new Date(lockedUntil) - new Date()) / 60000)
      toast.error(`Too many failed attempts. Please try again in ${remaining} minutes.`)
      return
    }

    setLoading(true)

    try {
      // 3. Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (error) {
        console.error('Login error:', error)
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          const isLocked = handleFailedAttempt()
          if (!isLocked) {
            const remaining = 5 - (attempts + 1)
            toast.error(`Invalid email or password. ${remaining} attempts remaining.`)
          }
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email address before logging in.')
        } else {
          toast.error('Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      // 4. Check if user has a dealer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, status, full_name, business_name, phone')
        .eq('id', data.user.id)  // Use ID instead of email for security
        .maybeSingle()

      if (profileError || !profileData) {
        await supabase.auth.signOut()
        toast.error('Account not found. Please register first.')
        setLoading(false)
        return
      }

      if (profileData.status !== 'active') {
        await supabase.auth.signOut()
        toast.error('Account is not active. Please contact support.')
        setLoading(false)
        return
      }

      // 5. Check if profile has a dealer record
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('id, status')
        .eq('profile_id', profileData.id)
        .maybeSingle()

      if (dealerError) {
        console.error('Dealer check error:', dealerError)
        await supabase.auth.signOut()
        toast.error('Account error. Please contact support.')
        setLoading(false)
        return
      }

      if (!dealerData) {
        // Try to create dealer record (shouldn't happen with proper registration)
        const { error: createDealerError } = await supabase
          .from('dealers')
          .insert([{
            profile_id: profileData.id,
            business_name: profileData.business_name || '',
            business_phone: profileData.phone || '',
            status: 'active'
          }])

        if (createDealerError) {
          console.error('Dealer creation error:', createDealerError)
          await supabase.auth.signOut()
          toast.error('Account setup incomplete. Please contact support.')
          setLoading(false)
          return
        }
      } else if (dealerData.status !== 'active') {
        await supabase.auth.signOut()
        toast.error('Dealer account is not active. Please contact support.')
        setLoading(false)
        return
      }

      // 6. Reset login attempts on success
      resetAttempts()

      // 7. Log successful login (optional - for activity tracking)
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            dealer_id: dealerData?.id || profileData.id,
            action: 'login',
            details: { 
              email: data.user.email,
              timestamp: new Date().toISOString()
            }
          }])
      } catch (logError) {
        // Don't block login if logging fails
        console.warn('Activity log error:', logError)
      }

      toast.success(`Welcome back, ${profileData.full_name || 'Dealer'}!`)
      
      // 8. Redirect to dealer dashboard
      navigate('/dealer/dashboard')

    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-2xl font-bold text-[#111111]">
              Vector<span className="text-[#555555]">DDK</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">Dealer Login</h1>
          <p className="text-[#555555] mt-1">Sign in to your VectorDDK dealer account</p>
        </div>

        {/* Locked Account Warning */}
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

        {/* Login Form */}
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
                placeholder="you@example.com"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E5E5E5] focus:ring-[#111111]"
                  disabled={isLocked()}
                />
                <span className="text-[#555555] text-sm">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-[#555555] hover:text-[#111111] transition-colors">
                Forgot password?
              </Link>
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

        <div className="mt-4 text-center">
          <p className="text-sm text-[#555555]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#111111] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login