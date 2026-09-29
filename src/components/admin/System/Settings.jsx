import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import { 
  Save,
  Globe,
  DollarSign,
  Shield,
  Mail,
  QrCode,
  CheckCircle,
  Users,
  Lock,
  Copy,
  Timer,
  Eye,
  EyeOff,
  Smartphone,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    general: {
      site_name: 'VectorDDK',
      support_email: 'support@vectorddk.com',
      support_phone: '+254 700 000 000',
    },
    dealer_settings: {
      auto_approve_registration: true,
      max_dealers: 1000,
    },
    token_settings: {
      min_purchase: 100,
      max_purchase: 10000,
    },
    report_settings: {
      report_id_prefix: 'VDDK',
      allow_public_verification: true,
    },
    notification_settings: {
      payment_alerts: true,
      report_alerts: true,
      dealer_alerts: true,
    }
  })

  // TOTP States
  const [totpSecret, setTotpSecret] = useState('')
  const [totpQr, setTotpQr] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [showTotpSetup, setShowTotpSetup] = useState(false)
  const [currentTotpCode, setCurrentTotpCode] = useState('')
  const [totpTimeRemaining, setTotpTimeRemaining] = useState(30)
  const [adminId, setAdminId] = useState(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [totpSetupLoading, setTotpSetupLoading] = useState(false)
  const [totpVerifyLoading, setTotpVerifyLoading] = useState(false)
  const [showTotpCode, setShowTotpCode] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
    getAdminUser()
  }, [])

  // TOTP timer
  useEffect(() => {
    if (!totpSecret) return

    const updateTotpCode = () => {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: 'VectorDDK',
          label: adminEmail,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: totpSecret
        })
        const code = totp.generate()
        setCurrentTotpCode(code)
        
        const now = Math.floor(Date.now() / 1000)
        const period = 30
        const elapsed = now % period
        const remaining = period - elapsed
        setTotpTimeRemaining(remaining)
      } catch (error) {
        console.error('TOTP generation error:', error)
      }
    }

    updateTotpCode()

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const period = 30
      const elapsed = now % period
      const remaining = period - elapsed
      setTotpTimeRemaining(remaining)
      
      if (remaining === 30) {
        updateTotpCode()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [totpSecret, adminEmail])

  const getAdminUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminEmail(user.email)
        const { data: admin } = await supabase
          .from('admin_users')
          .select('id, totp_enabled, totp_secret')
          .eq('email', user.email)
          .single()
        
        if (admin) {
          setAdminId(admin.id)
          setTotpEnabled(admin.totp_enabled || false)
          if (admin.totp_secret) {
            setTotpSecret(admin.totp_secret)
          }
        }
      }
    } catch (error) {
      console.error('Error getting admin user:', error)
    }
  }

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')

      if (error) throw error

      if (data && data.length > 0) {
        const newSettings = { ...settings }
        data.forEach(item => {
          if (item.key === 'general') newSettings.general = item.value
          else if (item.key === 'dealer_settings') newSettings.dealer_settings = item.value
          else if (item.key === 'token_settings') newSettings.token_settings = item.value
          else if (item.key === 'report_settings') newSettings.report_settings = item.value
          else if (item.key === 'notification_settings') newSettings.notification_settings = item.value
        })
        setSettings(newSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = [
        { key: 'general', value: settings.general },
        { key: 'dealer_settings', value: settings.dealer_settings },
        { key: 'token_settings', value: settings.token_settings },
        { key: 'report_settings', value: settings.report_settings },
        { key: 'notification_settings', value: settings.notification_settings }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value })
          .eq('key', update.key)

        if (error) {
          const { error: insertError } = await supabase
            .from('system_settings')
            .insert([{ key: update.key, value: update.value }])

          if (insertError) throw insertError
        }
      }

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (category, key, value) => {
    setSettings({
      ...settings,
      [category]: { ...settings[category], [key]: value }
    })
  }

  // ============ TOTP FUNCTIONS ============

  const generateTotpSecret = async () => {
    if (!adminEmail) {
      toast.error('Admin email not found')
      return
    }

    setTotpSetupLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('generate_admin_totp', {
          p_admin_email: adminEmail
        })

      if (error) throw error

      const secret = data.secret
      console.log('✅ Secret generated:', secret)
      setTotpSecret(secret)

      const totp = new OTPAuth.TOTP({
        issuer: 'VectorDDK',
        label: adminEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      })

      const otpauthUrl = totp.toString()
      
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#111111',
          light: '#FFFFFF'
        }
      })

      setTotpQr(qrDataUrl)
      setShowTotpSetup(true)
      toast.success('Scan the QR code with your authenticator app')

    } catch (error) {
      console.error('Error generating TOTP secret:', error)
      toast.error('Failed to setup 2FA')
    } finally {
      setTotpSetupLoading(false)
    }
  }

  const verifyTotpSetup = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error('Please enter the 6-digit code from your authenticator app')
      return
    }

    setTotpVerifyLoading(true)

    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'VectorDDK',
        label: adminEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: totpSecret
      })

      const delta = totp.validate({ token: totpCode, window: 1 })

      if (delta === null) {
        toast.error('Invalid code. Please try again.')
        setTotpVerifyLoading(false)
        return
      }

      // ✅ Enable TOTP in database
      const { data, error } = await supabase
        .from('admin_users')
        .update({ 
          totp_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()

      if (error) {
        console.error('Update error:', error)
        toast.error('Failed to enable 2FA: ' + error.message)
        setTotpVerifyLoading(false)
        return
      }

      console.log('✅ 2FA enabled:', data)

      setTotpEnabled(true)
      setShowTotpSetup(false)
      setTotpCode('')
      
      toast.success('2FA enabled successfully!')

    } catch (error) {
      console.error('Error verifying TOTP:', error)
      toast.error('Failed to verify 2FA setup')
    } finally {
      setTotpVerifyLoading(false)
    }
  }

  const disableTotp = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) {
      return
    }

    setDisableLoading(true)
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update({ 
          totp_enabled: false,
          totp_secret: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()

      if (error) {
        console.error('Disable error:', error)
        toast.error('Failed to disable 2FA: ' + error.message)
        setDisableLoading(false)
        return
      }

      console.log('✅ 2FA disabled:', data)

      setTotpEnabled(false)
      setTotpSecret('')
      setTotpQr('')
      setShowTotpSetup(false)
      
      toast.success('2FA disabled successfully')

    } catch (error) {
      console.error('Error disabling TOTP:', error)
      toast.error('Failed to disable 2FA')
    } finally {
      setDisableLoading(false)
    }
  }

  const copySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret)
      toast.success('Secret key copied to clipboard')
    }
  }

  // ============ UI COMPONENTS ============

  const SettingToggle = ({ category, settingKey, label, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#E5E5E5] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#111111]">{label}</p>
        {description && <p className="text-xs text-[#555555]">{description}</p>}
      </div>
      <button
        onClick={() => updateSetting(category, settingKey, !settings[category][settingKey])}
        className={`relative w-11 h-6 rounded-full transition-colors ${settings[category][settingKey] ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings[category][settingKey] ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )

  const SettingInput = ({ category, settingKey, label, description, type = 'text', placeholder }) => (
    <div className="py-3 border-b border-[#E5E5E5] last:border-0">
      <label className="block text-sm font-medium text-[#111111] mb-1">{label}</label>
      {description && <p className="text-xs text-[#555555] mb-2">{description}</p>}
      <input
        type={type}
        value={settings[category]?.[settingKey] || ''}
        onChange={(e) => updateSetting(category, settingKey, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
        className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
        placeholder={placeholder}
      />
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">System Settings</h1>
          <p className="text-sm text-[#555555]">Manage platform configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-[#555555]" />
            <h2 className="text-lg font-bold text-[#111111]">General Settings</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SettingInput category="general" settingKey="site_name" label="Site Name" />
            <SettingInput category="general" settingKey="support_email" label="Support Email" type="email" />
            <SettingInput category="general" settingKey="support_phone" label="Support Phone" />
          </div>
        </div>

        {/* Dealer Settings */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#555555]" />
            <h2 className="text-lg font-bold text-[#111111]">Dealer Settings</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SettingToggle category="dealer_settings" settingKey="auto_approve_registration" 
              label="Auto-Approve Registration" 
              description="Automatically approve new dealer registrations" />
            <SettingInput category="dealer_settings" settingKey="max_dealers" label="Maximum Dealers" type="number" />
          </div>
        </div>

        {/* Token Settings */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#555555]" />
            <h2 className="text-lg font-bold text-[#111111]">Token Settings</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SettingInput category="token_settings" settingKey="min_purchase" label="Minimum Token Purchase" type="number" />
            <SettingInput category="token_settings" settingKey="max_purchase" label="Maximum Token Purchase" type="number" />
          </div>
        </div>

        {/* Report Settings */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-[#555555]" />
            <h2 className="text-lg font-bold text-[#111111]">Report Settings</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SettingInput category="report_settings" settingKey="report_id_prefix" label="Report ID Prefix" />
            <SettingToggle category="report_settings" settingKey="allow_public_verification" 
              label="Allow Public Verification" 
              description="Allow anyone to verify reports without login" />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-[#555555]" />
            <h2 className="text-lg font-bold text-[#111111]">Notification Settings</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <SettingToggle category="notification_settings" settingKey="payment_alerts" 
              label="Payment Alerts" />
            <SettingToggle category="notification_settings" settingKey="report_alerts" 
              label="Report Alerts" />
            <SettingToggle category="notification_settings" settingKey="dealer_alerts" 
              label="Dealer Alerts" />
          </div>
        </div>

        {/* 2FA Section */}
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#555555]" />
            <h2 className="text-lg font-bold text-[#111111]">Two-Factor Authentication</h2>
            {totpEnabled ? (
              <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Enabled
              </span>
            ) : (
              <span className="ml-2 text-xs text-[#555555] bg-[#F6F6F6] px-2 py-0.5 rounded-full">
                Disabled
              </span>
            )}
          </div>

          <p className="text-sm text-[#555555] mb-4">
            {totpEnabled 
              ? 'Your admin account is secured with Google Authenticator.' 
              : 'Add an extra layer of security to your admin account.'}
          </p>

          {totpEnabled ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">2FA is active</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your account is protected with time-based one-time passwords.
                </p>
                {currentTotpCode && (
                  <div className="mt-3 bg-white rounded p-3 text-center border border-green-200">
                    <p className="text-xs text-[#555555]">Your current code</p>
                    <div className="flex items-center justify-center gap-4">
                      <p className="text-2xl font-mono font-bold text-[#111111] tracking-widest">
                        {currentTotpCode}
                      </p>
                      <button
                        onClick={() => setShowTotpCode(!showTotpCode)}
                        className="text-[#555555] hover:text-[#111111]"
                      >
                        {showTotpCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Timer className="w-4 h-4 text-[#555555]" />
                      <span className="text-sm text-[#555555]">
                        {totpTimeRemaining}s
                      </span>
                      <div className="w-16 h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#111111] rounded-full transition-all duration-1000"
                          style={{ width: `${(totpTimeRemaining / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={disableTotp}
                disabled={disableLoading}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {disableLoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          ) : showTotpSetup ? (
            <div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-[#F6F6F6] rounded-lg p-4 inline-block mx-auto">
                    {totpQr ? (
                      <img src={totpQr} alt="QR Code" className="w-48 h-48 mx-auto" />
                    ) : (
                      <div className="w-48 h-48 bg-[#E5E5E5] rounded flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-[#555555]" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <code className="text-xs bg-[#F6F6F6] px-3 py-1 rounded font-mono break-all max-w-[200px]">
                      {totpSecret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="text-[#555555] hover:text-[#111111]"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#555555] mt-2">
                    Scan QR code or enter secret key manually
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#111111] mb-2">Verify Setup</h3>
                  <p className="text-xs text-[#555555] mb-4">
                    Enter the 6-digit code from your authenticator app to confirm setup.
                  </p>

                  {currentTotpCode && (
                    <div className="bg-[#F6F6F6] rounded-lg p-3 mb-4 text-center">
                      <p className="text-xs text-[#555555]">Your current code</p>
                      <p className="text-2xl font-mono font-bold text-[#111111] tracking-widest">
                        {currentTotpCode}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Timer className="w-4 h-4 text-[#555555]" />
                        <span className="text-sm text-[#555555]">
                          {totpTimeRemaining}s
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-3 py-2 text-center text-xl tracking-widest border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#111111] font-mono"
                      placeholder="000000"
                      disabled={totpVerifyLoading}
                    />
                    <button
                      onClick={verifyTotpSetup}
                      disabled={totpVerifyLoading || totpCode.length !== 6}
                      className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#222222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {totpVerifyLoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowTotpSetup(false)
                      setTotpCode('')
                      setTotpSecret('')
                      setTotpQr('')
                    }}
                    className="mt-3 text-xs text-[#555555] hover:text-[#111111]"
                  >
                    Cancel Setup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={generateTotpSecret}
              disabled={totpSetupLoading}
              className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#222222] transition-colors disabled:opacity-50"
            >
              {totpSetupLoading ? 'Generating...' : 'Setup 2FA'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings