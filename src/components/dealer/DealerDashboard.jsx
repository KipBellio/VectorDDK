import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Wallet, 
  FileText, 
  CheckCircle, 
  Activity,
  ArrowRight,
  Download,
  CreditCard,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

const DealerDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    tokens: 0,
    reports: 0,
    verified: 0,
    tests: 0
  })
  const [recentReports, setRecentReports] = useState([])
  const [dealerName, setDealerName] = useState('Dealer')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        navigate('/login')
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
        setLoading(false)
        return
      }

      if (!profile) {
        setLoading(false)
        return
      }

      setDealerName(profile.full_name || 'Dealer')

      // Get dealer record
      const { data: dealer, error: dealerError } = await supabase
        .from('dealers')
        .select('id, business_name')
        .eq('profile_id', profile.id)
        .single()

      if (dealerError) {
        console.error('Dealer error:', dealerError)
        setLoading(false)
        return
      }

      if (!dealer) {
        setLoading(false)
        return
      }

      // 1. GET TOKEN BALANCE
      const { data: tokenData } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('dealer_id', dealer.id)
        .maybeSingle()

      const tokenBalance = tokenData?.balance || 0

      // 2. GET REPORTS COUNT (This is also the total tests)
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', dealer.id)

      // 3. GET VERIFIED REPORTS COUNT (reports with verification_count > 0)
      const { count: verifiedCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', dealer.id)
        .gt('verification_count', 0)

      // 4. GET RECENT REPORTS
      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_id, device_manufacturer, device_model, device_type, overall_result, created_at, verification_count')
        .eq('dealer_id', dealer.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Total Tests = Reports Count (since each report = one test)
      setStats({
        tokens: tokenBalance,
        reports: reportsCount || 0,
        verified: verifiedCount || 0,
        tests: reportsCount || 0
      })

      setRecentReports(reports || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getResultBadge = (result) => {
    if (!result) return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">PENDING</span>
    const isPass = result.toUpperCase() === 'PASS'
    return (
      <span className={`text-xs px-2 py-1 rounded ${isPass ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
        {isPass ? 'PASS' : 'FAIL'}
      </span>
    )
  }

  const StatCard = ({ title, value, icon: Icon, subtitle }) => (
    <div className="bg-white border border-[#E5E5E5] rounded p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#555555] uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-[#111111] mt-1">{loading ? '...' : value}</p>
          {subtitle && <p className="text-xs text-[#555555] mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-5 h-5 text-[#555555]" />
      </div>
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111111]">Dashboard</h1>
        <p className="text-sm text-[#555555]">Welcome back, {dealerName}</p>
      </div>

      {/* Token Balance Highlight */}
      <div className="bg-white border border-[#E5E5E5] rounded p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#555555]" />
              <span className="text-sm font-medium text-[#555555]">Your Tokens</span>
            </div>
            <p className="text-4xl font-bold text-[#111111] mt-1">{stats.tokens}</p>
            <p className="text-sm text-[#555555] mt-1">
              Tokens are only consumed when you generate a customer-verifiable report.
            </p>
          </div>
          <Link
            to="/dealer/buy-tokens"
            className="px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Buy Tokens
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Available Tokens" value={stats.tokens} icon={Wallet} />
        <StatCard title="Reports Generated" value={stats.reports} icon={FileText} />
        <StatCard title="Reports Verified" value={stats.verified} icon={CheckCircle} />
        <StatCard title="Total Tests" value={stats.tests} icon={Activity} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Link
          to="/dealer/reports"
          className="p-4 text-center border border-[#E5E5E5] rounded hover:border-[#111111] transition-colors bg-white"
        >
          <FileText className="w-6 h-6 text-[#555555] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#111111]">View Reports</p>
        </Link>
        <Link
          to="/dealer/buy-tokens"
          className="p-4 text-center border border-[#E5E5E5] rounded hover:border-[#111111] transition-colors bg-white"
        >
          <CreditCard className="w-6 h-6 text-[#555555] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#111111]">Buy Tokens</p>
        </Link>
        <Link
          to="/dealer/download"
          className="p-4 text-center border border-[#E5E5E5] rounded hover:border-[#111111] transition-colors bg-white"
        >
          <Download className="w-6 h-6 text-[#555555] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#111111]">Download DDK</p>
        </Link>
        <Link
          to="/dealer/settings"
          className="p-4 text-center border border-[#E5E5E5] rounded hover:border-[#111111] transition-colors bg-white"
        >
          <Settings className="w-6 h-6 text-[#555555] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#111111]">Account Settings</p>
        </Link>
      </div>

      {/* Recent Reports */}
      <div className="bg-white border border-[#E5E5E5] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#111111]">Recent Reports</h2>
          <Link to="/dealer/reports" className="text-sm text-[#555555] hover:text-[#111111] transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <p className="text-sm text-[#555555] text-center py-4">
            No customer-verifiable reports have been generated yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#E5E5E5]">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Report ID</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Device</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Type</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Result</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Created</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Verifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#F6F6F6] transition-colors cursor-pointer" onClick={() => navigate(`/dealer/reports/${report.id}`)}>
                    <td className="px-3 py-2 font-mono text-xs text-[#555555]">
                      {report.report_id || report.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[#111111]">{report.device_manufacturer || 'Unknown'}</span>
                      <span className="text-[#555555] text-xs block">{report.device_model || ''}</span>
                    </td>
                    <td className="px-3 py-2 text-[#555555]">{report.device_type || 'N/A'}</td>
                    <td className="px-3 py-2">{getResultBadge(report.overall_result)}</td>
                    <td className="px-3 py-2 text-[#555555] text-xs">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-center text-[#555555]">{report.verification_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DealerDashboard