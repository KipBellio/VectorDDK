import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Mail, Lock, User, Building, Phone, 
  ArrowLeft, Eye, EyeOff 
} from 'lucide-react'
import toast from 'react-hot-toast'

const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailForOtp, setEmailForOtp] = useState('')
  const [nameForOtp, setNameForOtp] = useState('')
  const [tempUserId, setTempUserId] = useState(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    business_name: '',
    phone: '',
    termsAccepted: false,
    privacyAccepted: false
  })
  
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus first OTP input on step change
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 100)
    }
  }, [step])

  // Validate email
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Validate password
  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    }
  }

  // Validate phone (Kenyan format)
  const validatePhone = (phone) => {
    return /^\+254[0-9]{9}$/.test(phone) || /^0[17][0-9]{8}$/.test(phone)
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    const newOtp = [...otpCode]
    newOtp[index] = value.replace(/\D/g, '')
    setOtpCode(newOtp)
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle OTP keydown (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newOtp = [...otpCode]
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i]
      }
      setOtpCode(newOtp)
      
      const lastFilledIndex = Math.min(digits.length - 1, 5)
      inputRefs.current[lastFilledIndex]?.focus()
    }
  }

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    const passwordChecks = validatePassword(formData.password)
    if (!Object.values(passwordChecks).every(Boolean)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!validatePhone(formData.phone)) {
      toast.error('Please enter a valid phone number (e.g., +254700000000 or 0712345678)')
      return
    }

    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast.error('Please accept the Terms and Privacy Policy')
      return
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', formData.email)
      .maybeSingle()

    if (existingUser) {
      toast.error('This email is already registered. Please login.')
      return
    }

    setLoading(true)

    try {
      // Create temporary auth user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            business_name: formData.business_name,
            phone: formData.phone
          }
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please login.')
        } else {
          toast.error('Registration failed. Please try again.')
        }
        setLoading(false)
        return
      }

      setTempUserId(data.user?.id)
      setEmailForOtp(formData.email)
      setNameForOtp(formData.full_name)

      // Generate and store OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      
      const { error: otpError } = await supabase
        .from('otp_verifications')
        .insert([{
          email: formData.email,
          otp_code: otp,
          purpose: 'registration',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          verified: false,
          attempts: 0
        }])

      if (otpError) {
        console.error('OTP store error:', otpError)
        toast.error('Failed to send verification code')
        setLoading(false)
        return
      }

      // Send OTP via Resend Edge Function
      const response = await supabase.functions.invoke('send-otp', {
        body: {
          email: formData.email,
          otp: otp,
          name: formData.full_name,
          purpose: 'registration'
        }
      })

      if (response.error) {
        console.error('Resend error:', response.error)
        toast.error('Failed to send verification code')
        setLoading(false)
        return
      }

      toast.success('Verification code sent to your email!')
      setStep(2)
      setResendCooldown(30)

    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Failed to send verification code. Please try again.')
      
      if (tempUserId) {
        try {
          await supabase.auth.admin.deleteUser(tempUserId)
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    
    const otp = otpCode.join('')
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    setOtpLoading(true)

    try {
      const { data: otpRecord, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', emailForOtp)
        .eq('otp_code', otp)
        .eq('purpose', 'registration')
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (otpError || !otpRecord) {
        const { data: expiredOtp } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('email', emailForOtp)
          .eq('otp_code', otp)
          .eq('purpose', 'registration')
          .maybeSingle()

        if (expiredOtp && expiredOtp.expires_at < new Date().toISOString()) {
          toast.error('Verification code has expired. Request a new one.')
        } else {
          toast.error('Invalid verification code. Please try again.')
          
          if (otpRecord) {
            const newAttempts = (otpRecord.attempts || 0) + 1
            await supabase
              .from('otp_verifications')
              .update({ attempts: newAttempts })
              .eq('id', otpRecord.id)
            
            if (newAttempts >= 5) {
              toast.error('Too many failed attempts. Request a new code.')
              await supabase
                .from('otp_verifications')
                .delete()
                .eq('id', otpRecord.id)
            }
          }
        }
        setOtpLoading(false)
        return
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', otpRecord.id)

      // Get the user ID from auth
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      if (!userId) {
        toast.error('User not found. Please try again.')
        setOtpLoading(false)
        return
      }

      // Create profile and dealer with the user ID
      const { error: rpcError } = await supabase
        .rpc('create_dealer_profile', {
          p_user_id: userId,
          p_email: emailForOtp,
          p_full_name: formData.full_name,
          p_business_name: formData.business_name,
          p_phone: formData.phone
        })

      if (rpcError) {
        console.error('Profile creation error:', rpcError)
        toast.error('Account setup failed. Please contact support.')
        setOtpLoading(false)
        return
      }

      // Delete used OTP records
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('email', emailForOtp)
        .eq('purpose', 'registration')

      toast.success('Account verified successfully! Please login.')

      setTimeout(() => {
        navigate('/login', { 
          state: { 
            email: emailForOtp,
            message: 'Account verified! Please login with your credentials.'
          }
        })
      }, 1500)

    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Verification failed. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('email', emailForOtp)
        .eq('purpose', 'registration')

      await supabase
        .from('otp_verifications')
        .insert([{
          email: emailForOtp,
          otp_code: otp,
          purpose: 'registration',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          verified: false,
          attempts: 0
        }])

      const response = await supabase.functions.invoke('send-otp', {
        body: {
          email: emailForOtp,
          otp: otp,
          name: nameForOtp,
          purpose: 'registration'
        }
      })

      if (response.error) {
        console.error('Resend error:', response.error)
        toast.error('Failed to resend verification code')
        return
      }

      toast.success('New verification code sent!')
      setResendCooldown(30)

    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Failed to resend code. Please try again.')
    }
  }

  // Step 1: Registration Form
  if (step === 1) {
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
            </div>
            <h1 className="text-2xl font-bold text-[#111111]">Create Your Dealer Account</h1>
            <p className="text-[#555555] mt-1">Start testing devices with VectorDDK</p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Business Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                  placeholder="Your business name"
                  required
                />
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Contact Person *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                  placeholder="Full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                  placeholder="+254700000000"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                  placeholder="Min 8 chars with uppercase, lowercase, number, special"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <span className={`${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-[#555555]'}`}>
                  ✓ Uppercase
                </span>
                <span className={`${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-[#555555]'}`}>
                  ✓ Lowercase
                </span>
                <span className={`${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-[#555555]'}`}>
                  ✓ Number
                </span>
                <span className={`${/[!@#$%^&*]/.test(formData.password) ? 'text-green-600' : 'text-[#555555]'}`}>
                  ✓ Special
                </span>
                <span className={`${formData.password.length >= 8 ? 'text-green-600' : 'text-[#555555]'}`}>
                  ✓ 8+ chars
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] transition-colors text-sm"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="rounded border-[#E5E5E5] focus:ring-[#111111]"
                />
                <span className="text-[#555555]">
                  I agree to the <Link to="/terms" className="text-[#111111] hover:underline">Terms of Service</Link>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.privacyAccepted}
                  onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                  className="rounded border-[#E5E5E5] focus:ring-[#111111]"
                />
                <span className="text-[#555555]">
                  I agree to the <Link to="/privacy" className="text-[#111111] hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending verification...' : 'Continue'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-[#555555]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#111111] font-medium hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: OTP Verification
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8">
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="float-left text-[#555555] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">Verify Your Email</h1>
          <p className="text-[#555555] mt-1">
            We sent a 6-digit code to <strong>{emailForOtp}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 transition-colors"
                  autoFocus={index === 0}
                  required
                />
              ))}
            </div>
            <p className="text-xs text-[#555555] text-center mt-2">
              Paste the code or enter it manually
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0}
              className="text-sm text-[#555555] hover:text-[#111111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 
                ? `Resend code in ${resendCooldown}s` 
                : 'Resend verification code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={otpLoading}
            className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {otpLoading ? 'Verifying...' : 'Verify Account'}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-2.5 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded-lg hover:bg-[#F6F6F6] transition-colors"
          >
            Back to Registration
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register