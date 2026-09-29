import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  Activity,
  Edit,
  Save,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const DealerDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dealer, setDealer] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    reports: 0,
    tokens: 0,
    payments: 0
  })
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [addingTokens, setAddingTokens] = useState(false)

  useEffect(() => {
    fetchDealerDetails()
  }, [id])

  const fetchDealerDetails = async () => {
    setLoading(true)
    try {
      console.log('🔍 Fetching dealer with ID/Profile ID:', id)

      // Step 1: Try to find the dealer directly by ID first
      let { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('*, profiles(*)')
        .eq('id', id)
        .maybeSingle()

      // Step 2: If not found, try finding by profile_id
      if (dealerError || !dealerData) {
        console.log('🔍 Dealer not found by ID, trying profile_id...')
        
        const { data: dealerByProfile, error: profileError } = await supabase
          .from('dealers')
          .select('*, profiles(*)')
          .eq('profile_id', id)
          .maybeSingle()

        if (profileError || !dealerByProfile) {
          console.error('❌ Dealer not found by ID or profile_id:', profileError || dealerError)
          toast.error('Dealer not found')
          setLoading(false)
          return
        }

        dealerData = dealerByProfile
        console.log('✅ Dealer found by profile_id:', dealerData)
      } else {
        console.log('✅ Dealer found by ID:', dealerData)
      }

      setDealer(dealerData)
      setProfile(dealerData.profiles)
      setFormData({
        ...dealerData,
        full_name: dealerData.profiles?.full_name || '',
        email: dealerData.profiles?.email || '',
        phone: dealerData.profiles?.phone || ''
      })

      // Step 3: Use the actual dealer.id for stats queries
      const dealerId = dealerData.id
      console.log('🔍 Fetching stats for dealer_id:', dealerId)

      // Fetch reports count
      const { count: reportsCount, error: reportsError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', dealerId)

      if (reportsError) {
        console.error('❌ Reports error:', reportsError)
      } else {
        console.log('✅ Reports count:', reportsCount)
      }

      // Fetch token balance - using maybeSingle() to avoid 406 error
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('dealer_id', dealerId)
        .maybeSingle()

      if (tokenError) {
        console.error('❌ Token error:', tokenError)
      } else {
        console.log('✅ Token balance:', tokenData?.balance || 0)
      }

      // Fetch payments count
      const { count: paymentsCount, error: paymentsError } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', dealerId)

      if (paymentsError) {
        console.error('❌ Payments error:', paymentsError)
      } else {
        console.log('✅ Payments count:', paymentsCount || 0)
      }

      setStats({
        reports: reportsCount || 0,
        tokens: tokenData?.balance || 0,
        payments: paymentsCount || 0
      })

      console.log('✅ Final stats:', {
        reports: reportsCount || 0,
        tokens: tokenData?.balance || 0,
        payments: paymentsCount || 0
      })

    } catch (error) {
      console.error('❌ Error fetching dealer:', error)
      toast.error('Failed to load dealer details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('dealers')
        .update({ status: newStatus })
        .eq('id', dealer.id)

      if (error) throw error

      setDealer({ ...dealer, status: newStatus })
      toast.success(`Dealer status updated to ${newStatus}`)
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    }
  }

  const handleSave = async () => {
    try {
      // Update dealer table
      const { error: dealerError } = await supabase
        .from('dealers')
        .update({
          business_name: formData.business_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealer.id)

      if (dealerError) throw dealerError

      // Update profile table using profile_id from dealer
      const profileId = dealer.profile_id || dealer.profiles?.id
      if (profileId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId)

        if (profileError) throw profileError
      }

      setDealer({ ...dealer, ...formData })
      setProfile({ ...profile, full_name: formData.full_name, phone: formData.phone })
      setEditing(false)
      toast.success('Dealer updated successfully')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update dealer')
    }
  }

  const handleAddTokens = async () => {
    const input = document.getElementById('tokenAmount')
    if (!input) {
      console.error('❌ Input element not found')
      toast.error('Input element not found')
      return
    }
    
    const amount = parseInt(input.value)
    console.log('🔍 Attempting to add tokens:', amount)
    
    if (!amount || amount < 1) {
      toast.error('Please enter a valid token amount')
      return
    }

    setAddingTokens(true)

    try {
      console.log('🔍 Dealer ID:', dealer.id)
      
      // Get current token balance
      const { data: tokenData, error: fetchError } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('dealer_id', dealer.id)
        .maybeSingle()

      console.log('📊 Current token data:', tokenData)
      if (fetchError) console.log('📊 Fetch error:', fetchError)

      const currentBalance = tokenData?.balance || 0
      const newBalance = currentBalance + amount

      console.log('📊 Current balance:', currentBalance)
      console.log('📊 New balance:', newBalance)

      let result
      if (tokenData) {
        // Update existing balance
        const { data, error: updateError } = await supabase
          .from('token_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('dealer_id', dealer.id)
          .select()

        result = data
        if (updateError) throw updateError
        console.log('✅ Update result:', result)
      } else {
        // Create new balance record
        const { data, error: insertError } = await supabase
          .from('token_balances')
          .insert([{
            dealer_id: dealer.id,
            balance: amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        result = data
        if (insertError) throw insertError
        console.log('✅ Insert result:', result)
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert([{
          dealer_id: dealer.id,
          transaction_type: 'PROMOTIONAL',
          amount: amount,
          balance_after: newBalance,
          reference_id: `admin-${Date.now()}`,
          reason: `Promotional tokens added by admin`
        }])

      if (transactionError) {
        console.error('⚠️ Transaction error:', transactionError)
      }

      console.log('✅ Tokens added successfully, new balance:', newBalance)

      // Update local state directly
      setStats(prev => ({
        ...prev,
        tokens: newBalance
      }))

      // Clear input
      input.value = ''
      
      toast.success(`Added ${amount} tokens to dealer`)
      
      // Refresh the stats from database after a short delay
      setTimeout(() => {
        fetchDealerDetails()
      }, 500)

    } catch (error) {
      console.error('❌ Error adding tokens:', error)
      toast.error('Failed to add tokens: ' + error.message)
    } finally {
      setAddingTokens(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-50',
      suspended: 'text-red-600 bg-red-50',
      inactive: 'text-gray-500 bg-gray-100',
      pending: 'text-yellow-600 bg-yellow-50'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[status] || 'text-gray-500 bg-gray-100'}`}>
        {status || 'Pending'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!dealer) {
    return (
      <div className="text-center py-12">
        <p className="text-[#555555]">Dealer not found</p>
        <Link to="/admin/dealers" className="text-sm text-[#555555] hover:text-[#111111] mt-2 inline-block">
          ← Back to dealers
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/dealers" className="text-[#555555] hover:text-[#111111]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Dealer Details</h1>
          <p className="text-sm text-[#555555]">View and manage dealer information</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#555555]" />
                </div>
                <div>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.full_name || ''}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="text-lg font-bold text-[#111111] border border-[#E5E5E5] rounded px-2 py-1"
                    />
                  ) : (
                    <h2 className="text-lg font-bold text-[#111111]">
                      {profile?.full_name || dealer?.profiles?.full_name || 'N/A'}
                    </h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(dealer.status)}
                    {dealer.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange('suspended')}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline"
                      >
                        Suspend
                      </button>
                    )}
                    {dealer.status === 'suspended' && (
                      <button
                        onClick={() => handleStatusChange('active')}
                        className="text-xs text-green-600 hover:text-green-700 hover:underline"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-[#111111] text-white text-sm rounded hover:bg-[#222222] transition-colors flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          ...dealer,
                          full_name: profile?.full_name || '',
                          phone: profile?.phone || ''
                        })
                      }}
                      className="px-3 py-1.5 border border-[#E5E5E5] text-[#555555] text-sm rounded hover:bg-[#F6F6F6] transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 border border-[#E5E5E5] text-[#555555] text-sm rounded hover:bg-[#F6F6F6] transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Email</p>
                <p className="text-sm text-[#111111] flex items-center gap-2 mt-0.5">
                  <Mail className="w-4 h-4 text-[#555555]" />
                  {profile?.email || dealer?.profiles?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Phone</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-sm text-[#111111] border border-[#E5E5E5] rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="text-sm text-[#111111] flex items-center gap-2 mt-0.5">
                    <Phone className="w-4 h-4 text-[#555555]" />
                    {profile?.phone || dealer?.profiles?.phone || 'N/A'}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-[#555555] uppercase tracking-wider">Business Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.business_name || ''}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="text-sm text-[#111111] border border-[#E5E5E5] rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="text-sm text-[#111111] flex items-center gap-2 mt-0.5">
                    <Building className="w-4 h-4 text-[#555555]" />
                    {dealer.business_name || 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Dealer ID</p>
                <p className="text-sm text-[#111111] flex items-center gap-2 mt-0.5 font-mono">
                  <CheckCircle className="w-4 h-4 text-[#555555]" />
                  {dealer.id ? dealer.id.substring(0, 8) + '...' : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Joined</p>
                <p className="text-sm text-[#111111] flex items-center gap-2 mt-0.5">
                  <Calendar className="w-4 h-4 text-[#555555]" />
                  {dealer.created_at ? new Date(dealer.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-[#E5E5E5] rounded p-4 text-center">
              <FileText className="w-5 h-5 text-[#555555] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#111111]">{stats.reports}</p>
              <p className="text-xs text-[#555555]">Reports</p>
            </div>
            <div className="bg-white border border-[#E5E5E5] rounded p-4 text-center">
              <CreditCard className="w-5 h-5 text-[#555555] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#111111]">{stats.tokens}</p>
              <p className="text-xs text-[#555555]">Tokens</p>
            </div>
            <div className="bg-white border border-[#E5E5E5] rounded p-4 text-center">
              <Activity className="w-5 h-5 text-[#555555] mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#111111]">{stats.payments}</p>
              <p className="text-xs text-[#555555]">Payments</p>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded p-4">
            <h3 className="text-sm font-medium text-[#111111] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/admin/reports?dealer=${dealer.id}`)}
                className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors"
              >
                View Reports →
              </button>
              <button
                onClick={() => navigate(`/admin/payments?dealer=${dealer.id}`)}
                className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors"
              >
                View Payments →
              </button>
              <button
                onClick={() => handleStatusChange(dealer.status === 'active' ? 'suspended' : 'active')}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  dealer.status === 'active' 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {dealer.status === 'active' ? 'Suspend Dealer' : 'Reactivate Dealer'}
              </button>
            </div>
          </div>

          {/* Token Management - WORKING VERSION */}
          <div className="bg-white border border-[#E5E5E5] rounded p-4">
            <h3 className="text-sm font-medium text-[#111111] mb-3">Token Management</h3>
            <div className="flex gap-2">
              <input
                type="number"
                id="tokenAmount"
                placeholder="Amount"
                className="flex-1 px-3 py-1.5 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111]"
                min="1"
                defaultValue=""
              />
              <button 
                onClick={handleAddTokens}
                disabled={addingTokens}
                className="px-3 py-1.5 bg-[#111111] text-white text-sm rounded hover:bg-[#222222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingTokens ? 'Adding...' : 'Add'}
              </button>
            </div>
            <p className="text-xs text-[#555555] mt-2">Add promotional tokens to this dealer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DealerDetails