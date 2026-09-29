import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Download, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Wallet,
  History
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const DealerSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [tokenBalance, setTokenBalance] = useState(0)
  const [dealerName, setDealerName] = useState('Dealer')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDealerData()
  }, [])

  const fetchDealerData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Get dealer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, business_name')
        .eq('email', session.user.email)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
      } else if (profile) {
        setDealerName(profile.full_name || 'Dealer')
        setBusinessName(profile.business_name || '')

        // Get dealer record to get dealer_id
        const { data: dealer, error: dealerError } = await supabase
          .from('dealers')
          .select('id')
          .eq('profile_id', profile.id)
          .single()

        if (dealerError) {
          console.error('Dealer error:', dealerError)
        } else if (dealer) {
          // Get token balance
          const { data: tokenData, error: tokenError } = await supabase
            .from('token_balances')
            .select('balance')
            .eq('dealer_id', dealer.id)
            .single()

          if (tokenError) {
            console.error('Token balance error:', tokenError)
          } else if (tokenData) {
            setTokenBalance(tokenData.balance || 0)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }))
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

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dealer/dashboard',
      single: true
    },
    {
      icon: FileText,
      label: 'Diagnostics',
      path: '/dealer/reports',
      subItems: [
        { label: 'Reports', path: '/dealer/reports' },
      ]
    },
    {
      icon: CreditCard,
      label: 'Tokens',
      path: '/dealer/tokens',
      subItems: [
        { label: 'Buy Tokens', path: '/dealer/buy-tokens' },
        { label: 'Transactions', path: '/dealer/transactions' },
      ]
    },
    {
      icon: Download,
      label: 'Software',
      path: '/dealer/download',
      subItems: [
        { label: 'Download DDK', path: '/dealer/download' },
      ]
    },
    {
      icon: Settings,
      label: 'Account',
      path: '/dealer/settings',
      subItems: [
        { label: 'Settings', path: '/dealer/settings' },
      ]
    },
  ]

  const isActive = (path) => location.pathname === path
  const isSubActive = (subItems) => {
    if (!subItems) return false
    return subItems.some(item => location.pathname === item.path)
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-[#E5E5E5] rounded"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#E5E5E5] z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[#E5E5E5]">
            <Link to="/dealer/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#111111] rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div>
                <span className="text-lg font-bold text-[#111111]">Vector<span className="text-[#555555]">DDK</span></span>
                <span className="block text-[10px] text-[#555555] font-medium uppercase tracking-wider">Dealer Portal</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = expanded[item.label]
              const isActiveItem = isActive(item.path) || isSubActive(item.subItems)

              if (item.single) {
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#F6F6F6] text-[#111111] font-medium'
                        : 'text-[#555555] hover:bg-[#F6F6F6] hover:text-[#111111]'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              }

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded transition-colors ${
                      isActiveItem
                        ? 'bg-[#F6F6F6] text-[#111111] font-medium'
                        : 'text-[#555555] hover:bg-[#F6F6F6] hover:text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setIsOpen(false)}
                          className={`block px-3 py-1.5 text-sm rounded transition-colors ${
                            isActive(sub.path)
                              ? 'bg-[#F6F6F6] text-[#111111] font-medium'
                              : 'text-[#555555] hover:bg-[#F6F6F6] hover:text-[#111111]'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer - Token Balance + User */}
          <div className="p-4 border-t border-[#E5E5E5]">
            <div className="bg-[#F6F6F6] rounded p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#555555]" />
                  <span className="text-xs text-[#555555] font-medium">Tokens</span>
                </div>
                <span className="text-lg font-bold text-[#111111]">{loading ? '...' : tokenBalance}</span>
              </div>
              <p className="text-[10px] text-[#555555] mt-1">Available for reports</p>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-[#111111]">
                  {dealerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">{dealerName}</p>
                {businessName && (
                  <p className="text-xs text-[#555555] truncate">{businessName}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#555555] hover:text-[#111111] hover:bg-[#F6F6F6] rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default DealerSidebar