import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  Wallet,
  AlertCircle,
  Loader
} from 'lucide-react'
import toast from 'react-hot-toast'

const BuyTokens = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dealerId, setDealerId] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchPackagesAndDealer()
  }, [])

  const fetchPackagesAndDealer = async () => {
    setLoading(true)
    try {
      // Get dealer ID
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        navigate('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (profile) {
        const { data: dealer } = await supabase
          .from('dealers')
          .select('id')
          .eq('profile_id', profile.id)
          .single()

        if (dealer) {
          setDealerId(dealer.id)
        }
      }

      // Fetch token packages
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('status', 'active')
        .order('token_count', { ascending: true })

      if (error) {
        console.error('Error fetching packages:', error)
        toast.error('Failed to load token packages')
        return
      }

      setPackages(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg)
    setPhoneNumber('')
    setShowPaymentModal(true)
  }

  const processPayment = async () => {
    if (!selectedPackage) return
    
    // Validate phone number
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 12) {
      toast.error('Please enter a valid phone number (e.g., 254700000000)')
      return
    }

    setProcessing(true)

    try {
      // Here we'll integrate M-Pesa Daraja Sandbox
      // For now, we'll simulate the payment flow
      
      // Step 1: Initiate payment
      // Step 2: M-Pesa prompt
      // Step 3: Confirm payment
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Step 4: On successful payment, credit tokens
      const { error: creditError } = await supabase.rpc('credit_tokens', {
        p_dealer_id: dealerId,
        p_amount: selectedPackage.token_count,
        p_transaction_type: 'PURCHASE',
        p_reference: `TXN-${Date.now()}`,
        p_reason: `Purchased ${selectedPackage.name} package`
      })

      if (creditError) {
        console.error('Credit error:', creditError)
        toast.error('Payment successful but token credit failed. Please contact support.')
        setProcessing(false)
        return
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          dealer_id: dealerId,
          token_package_id: selectedPackage.id,
          amount: selectedPackage.price,
          currency: selectedPackage.currency || 'KES',
          mpesa_reference: `MPESA-${Date.now()}`,
          status: 'completed',
          payment_data: {
            phone: cleaned,
            package: selectedPackage.name,
            tokens: selectedPackage.token_count
          }
        }])

      if (paymentError) {
        console.error('Payment record error:', paymentError)
      }

      toast.success(`${selectedPackage.token_count} tokens added to your account!`)
      setShowPaymentModal(false)
      setSelectedPackage(null)
      setPhoneNumber('')
      
      // Refresh packages to show updated data
      fetchPackagesAndDealer()

    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1)
    }
    if (cleaned.startsWith('254')) {
      return cleaned
    }
    return cleaned
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
        <h1 className="text-2xl font-bold text-[#111111]">Buy Tokens</h1>
        <p className="text-sm text-[#555555]">Purchase tokens to generate customer-verifiable diagnostic reports</p>
      </div>

      {/* Info Box */}
      <div className="bg-[#F6F6F6] border border-[#E5E5E5] rounded p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#555555] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[#555555]">
            <strong className="text-[#111111]">How tokens work:</strong> Tokens are only consumed when you generate a customer-verifiable report. 
            Diagnostic testing itself is <strong className="text-[#111111]">completely free and unlimited</strong>.
          </p>
        </div>
      </div>

      {/* Token Packages Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {packages.length === 0 ? (
          <div className="col-span-3 bg-white border border-[#E5E5E5] rounded p-8 text-center">
            <CreditCard className="w-12 h-12 text-[#555555] mx-auto mb-3" />
            <p className="text-[#555555]">No token packages available</p>
            <p className="text-sm text-[#555555]">Please check back later</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="bg-white border border-[#E5E5E5] rounded p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#111111]">{pkg.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-[#111111]">{pkg.token_count}</span>
                  <span className="text-sm text-[#555555] ml-1">tokens</span>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-[#111111]">{pkg.currency || 'KES'} {pkg.price.toLocaleString()}</span>
                </div>
                <div className="mt-4 text-sm text-[#555555]">
                  <span className="block">KSh {(pkg.price / pkg.token_count).toFixed(2)} per token</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-[#555555]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {pkg.token_count} customer-verifiable reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Unlimited testing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    No expiry
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handlePurchase(pkg)}
                className="mt-6 w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Purchase
              </button>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-[#111111] mb-2">Confirm Purchase</h2>
            <p className="text-sm text-[#555555] mb-4">
              You are about to purchase <strong className="text-[#111111]">{selectedPackage.token_count} tokens</strong> for <strong className="text-[#111111]">{selectedPackage.currency || 'KES'} {selectedPackage.price.toLocaleString()}</strong>
            </p>

            <div className="bg-[#F6F6F6] rounded p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#555555]">Package</span>
                <span className="font-medium text-[#111111]">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555555]">Tokens</span>
                <span className="font-medium text-[#111111]">{selectedPackage.token_count}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555555]">Amount</span>
                <span className="font-medium text-[#111111]">{selectedPackage.currency || 'KES'} {selectedPackage.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#111111] mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254700000000"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
              />
              <p className="text-xs text-[#555555] mt-1">
                Enter your M-Pesa registered phone number
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={processPayment}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {selectedPackage.currency || 'KES'} {selectedPackage.price.toLocaleString()}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedPackage(null)
                  setPhoneNumber('')
                }}
                className="px-4 py-2 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded hover:bg-[#F6F6F6] transition-colors"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-[#555555] text-center mt-4">
              Payment is processed via M-Pesa Daraja (Sandbox for testing)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyTokens