import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Lock, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react'
import toast from 'react-hot-toast'

const DealerSettings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_address: '',
    business_phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [dealerId, setDealerId] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        navigate('/login')
        return
      }

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        toast.error('Failed to load profile')
        return
      }

      setProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        business_name: profileData.business_name || '',
        business_address: profileData.business_address || '',
        business_phone: profileData.phone || ''
      })

      // Get dealer record
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('id, business_address')
        .eq('profile_id', profileData.id)
        .single()

      if (dealerData) {
        setDealerId(dealerData.id)
        setProfile(prev => ({
          ...prev,
          business_address: dealerData.business_address || ''
        }))
      }

    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        return
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          business_name: profile.business_name
        })
        .eq('email', session.user.email)

      if (profileError) {
        console.error('Profile update error:', profileError)
        toast.error('Failed to update profile')
        return
      }

      // Update dealer
      if (dealerId) {
        const { error: dealerError } = await supabase
          .from('dealers')
          .update({
            business_address: profile.business_address,
            business_phone: profile.phone
          })
          .eq('id', dealerId)

        if (dealerError) {
          console.error('Dealer update error:', dealerError)
        }
      }

      toast.success('Profile updated successfully!')

    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) {
        console.error('Password update error:', error)
        toast.error('Failed to update password. Please check your current password.')
        return
      }

      toast.success('Password updated successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })

    } catch (error) {
      console.error('Password error:', error)
      toast.error('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111111]">Account Settings</h1>
        <p className="text-sm text-[#555555]">Manage your profile, business information, and security</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <h2 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#555555]" />
            Profile Information
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="email"
                  value={profile.email}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-[#F6F6F6]"
                  disabled
                />
              </div>
              <p className="text-xs text-[#555555] mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Business Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="text"
                  value={profile.business_name}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Business Address
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="text"
                  value={profile.business_address}
                  onChange={(e) => setProfile({ ...profile, business_address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="Nairobi, Kenya"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security Section */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <h2 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#555555]" />
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full pl-4 pr-10 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111] transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full pl-4 pr-10 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111] transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full pl-4 pr-10 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Logout */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <h2 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-[#555555]" />
              Session
            </h2>
            <p className="text-sm text-[#555555] mb-4">
              Log out of your VectorDDK dealer account.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 border border-red-300 hover:border-red-500 text-red-600 hover:text-red-700 text-sm font-medium rounded transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DealerSettings