import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [error, setError] = useState('')

  // Load attempts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('reset_attempts')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.email === email && data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
          setLockedUntil(new Date(data.lockedUntil))
          setAttempts(data.count || 0)
        }
      } catch (e) {
        // ignore
      }
    }
  }, [email])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Validate email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Check if account is locked
  const isLocked = () => {
    if (!lockedUntil) return false
    return new Date(lockedUntil) > new Date()
  }

  // Handle failed attempt
  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    // Lock after 5 failed attempts
    if (newAttempts >= 5) {
      const lockTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      setLockedUntil(lockTime)
      
      localStorage.setItem('reset_attempts', JSON.stringify({
        email: email,
        count: newAttempts,
        lockedUntil: lockTime.toISOString()
      }))

      setError('Too many failed attempts. Please try again in 15 minutes.')
      return true
    }

    localStorage.setItem('reset_attempts', JSON.stringify({
      email: email,
      count: newAttempts,
      lockedUntil: lockedUntil
    }))

    return false
  }

  // Reset attempts on success
  const resetAttempts = () => {
    setAttempts(0)
    setLockedUntil(null)
    localStorage.removeItem('reset_attempts')
    setError('')
  }

  const handleSendResetLink = async (e) => {
    e.preventDefault()
    
    // Validate email
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Check if locked
    if (isLocked()) {
      const remaining = Math.ceil((new Date(lockedUntil) - new Date()) / 60000)
      toast.error(`Too many attempts. Please try again in ${remaining} minutes.`)
      return
    }

    // Check if resend cooldown is active
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown}s before requesting another link.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if user exists (optional - for better UX, but don't reveal if not found)
      // We'll just let Supabase handle it
      
      // Send reset email
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (error) {
        console.error('Reset error:', error)
        
        // Handle specific errors
        if (error.message.includes('rate_limit')) {
          handleFailedAttempt()
          toast.error('Too many requests. Please wait before trying again.')
        } else {
          // Don't reveal if email exists or not - generic message
          setSent(true)
          toast.success('If your email is registered, you will receive a reset link.')
        }
        setLoading(false)
        return
      }

      // Success
      resetAttempts()
      setSent(true)
      setResendCooldown(30)
      toast.success('Reset link sent to your email!')

    } catch (error) {
      console.error('Error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    setSent(false)
    setEmail('')
    // Focus the email input
    setTimeout(() => {
      document.getElementById('email-input')?.focus()
    }, 100)
  }

  // ✅ SHOW SUCCESS MESSAGE - STAY ON THIS PAGE
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">Check Your Email</h1>
          <p className="text-[#555555] mt-2">
            We sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-[#555555] mt-1">
            Click the link in your email to set a new password.
          </p>
          <p className="text-xs text-[#555555] mt-4">
            The link will expire in 1 hour.
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full py-2.5 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded-lg hover:bg-[#F6F6F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 
                ? `Resend available in ${resendCooldown}s` 
                : 'Resend Link'}
            </button>
            <Link to="/login" className="block text-[#111111] font-medium hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ✅ INITIAL FORM
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8">
        <div className="text-center mb-8">
          <Link to="/login" className="float-left text-[#555555] hover:text-[#111111] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-2xl font-bold text-[#111111]">
              Vector<span className="text-[#555555]">DDK</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">Reset Password</h1>
          <p className="text-[#555555] mt-1">We'll send you a link to reset your password</p>
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

        <form onSubmit={handleSendResetLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                id="email-input"
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

          <button
            type="submit"
            disabled={loading || isLocked()}
            className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-[#555555]">
            Remember your password?{' '}
            <Link to="/login" className="text-[#111111] font-medium hover:underline">
              Back to Login
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E5E5E5] text-center">
          <p className="text-xs text-[#555555]">
            The reset link will expire in 1 hour.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword