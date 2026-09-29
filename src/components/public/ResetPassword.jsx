import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get the session from the URL hash
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
      isValid: password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[a-z]/.test(password) && 
               /[0-9]/.test(password) && 
               /[!@#$%^&*]/.test(password)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    const passwordChecks = validatePassword(newPassword)
    if (!passwordChecks.isValid) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password update error:', error)
        toast.error('Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      toast.success('Password reset successfully! Please login.')

      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successfully! Please login with your new password.'
          }
        })
      }, 1500)

    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-[#111111]">Invalid or Expired Link</h1>
          <p className="text-[#555555] mt-2">
            The password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="inline-block mt-4 text-[#111111] font-medium hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">Set New Password</h1>
          <p className="text-[#555555] mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                placeholder="Min 8 chars with uppercase, lowercase, number, special"
                required
                minLength={8}
              />
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className={`${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-[#555555]'}`}>
                ✓ Uppercase
              </span>
              <span className={`${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-[#555555]'}`}>
                ✓ Lowercase
              </span>
              <span className={`${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-[#555555]'}`}>
                ✓ Number
              </span>
              <span className={`${/[!@#$%^&*]/.test(newPassword) ? 'text-green-600' : 'text-[#555555]'}`}>
                ✓ Special
              </span>
              <span className={`${newPassword.length >= 8 ? 'text-green-600' : 'text-[#555555]'}`}>
                ✓ 8+ chars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                placeholder="Confirm your new password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword