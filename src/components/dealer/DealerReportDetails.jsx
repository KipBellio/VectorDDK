import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Laptop,
  Smartphone,
  Cpu,
  HardDrive,
  Battery,
  Monitor,
  Wifi,
  Shield,
  QrCode,
  Eye,
  Copy,
  Download,
  Printer
} from 'lucide-react'
import toast from 'react-hot-toast'

const DealerReportDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [dealer, setDealer] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    fetchReportDetails()
  }, [id])

  const fetchReportDetails = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        navigate('/login')
        return
      }

      // Get dealer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, business_name, email, phone')
        .eq('email', session.user.email)
        .single()

      if (profile) {
        setDealer({
          full_name: profile.full_name,
          business_name: profile.business_name,
          email: profile.email,
          phone: profile.phone
        })
      }

      // Get report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (reportError) {
        console.error('Report error:', reportError)
        toast.error('Report not found')
        navigate('/dealer/reports')
        return
      }

      setReport(reportData)

      // Get QR verification data
      if (reportData.qr_status === 'active') {
        const { data: qrData } = await supabase
          .from('qr_verifications')
          .select('*')
          .eq('report_id', reportData.id)
          .single()

        if (qrData) {
          setQrCode(qrData)
        }
      }

    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  const getResultBadge = (result) => {
    if (!result) return <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded">PENDING</span>
    const isPass = result.toUpperCase() === 'PASS'
    return (
      <span className={`text-xs px-3 py-1.5 rounded font-medium ${isPass ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
        {isPass ? '✓ PASS' : '✗ FAIL'}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-50',
      inactive: 'text-gray-500 bg-gray-100',
      expired: 'text-red-600 bg-red-50',
      used: 'text-blue-600 bg-blue-50'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[status] || 'text-gray-500 bg-gray-100'}`}>
        {status || 'Active'}
      </span>
    )
  }

  const getDeviceIcon = (type) => {
    if (type?.toLowerCase() === 'laptop') {
      return <Laptop className="w-5 h-5 text-[#555555]" />
    }
    return <Smartphone className="w-5 h-5 text-[#555555]" />
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    toast.success(`${label} copied to clipboard!`)
    setTimeout(() => setCopySuccess(false), 3000)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-[#555555]">Report not found</p>
        <Link to="/dealer/reports" className="text-sm text-[#555555] hover:text-[#111111] mt-2 inline-block">
          ← Back to reports
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dealer/reports" className="text-[#555555] hover:text-[#111111]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111111]">Diagnostic Report</h1>
            {getResultBadge(report.overall_result)}
          </div>
          <p className="text-sm text-[#555555]">
            Report ID: {report.report_id || report.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Information */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getDeviceIcon(report.device_type)}
                <div>
                  <h2 className="text-xl font-bold text-[#111111]">
                    {report.device_manufacturer || 'Unknown'} {report.device_model || 'Device'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[#555555]">
                    <span>{report.device_type || 'N/A'}</span>
                    <span>•</span>
                    <span>Serial: {report.serial_number || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#555555]">QR Status</span>
                <div className="mt-1">{getStatusBadge(report.qr_status)}</div>
              </div>
            </div>

            {/* Device Specs Grid */}
            {report.diagnostic_results && (
              <div className="grid md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#E5E5E5]">
                {Object.entries(report.diagnostic_results).map(([key, value]) => {
                  // Skip empty values
                  if (!value) return null
                  
                  const iconMap = {
                    cpu: <Cpu className="w-4 h-4 text-[#555555]" />,
                    ram: <HardDrive className="w-4 h-4 text-[#555555]" />,
                    storage: <HardDrive className="w-4 h-4 text-[#555555]" />,
                    battery: <Battery className="w-4 h-4 text-[#555555]" />,
                    display: <Monitor className="w-4 h-4 text-[#555555]" />,
                    network: <Wifi className="w-4 h-4 text-[#555555]" />,
                    security: <Shield className="w-4 h-4 text-[#555555]" />
                  }
                  
                  const label = key.replace(/_/g, ' ').toUpperCase()
                  const icon = iconMap[key] || <FileText className="w-4 h-4 text-[#555555]" />
                  
                  return (
                    <div key={key} className="flex items-center gap-3 bg-[#F6F6F6] rounded p-3">
                      {icon}
                      <div>
                        <p className="text-xs text-[#555555] uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-[#111111]">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Verification Information */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <h3 className="text-sm font-medium text-[#111111] mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#555555]" />
              Verification Information
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Verification Count</p>
                <p className="text-lg font-bold text-[#111111]">{report.verification_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">QR Status</p>
                <p className="text-lg font-medium text-[#111111]">{getStatusBadge(report.qr_status)}</p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Last Verified</p>
                <p className="text-lg font-medium text-[#111111]">
                  {report.updated_at ? formatDate(report.updated_at) : 'Never'}
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-[#F6F6F6] rounded text-sm text-[#555555]">
              1 token was consumed when this customer-verifiable report was generated. Verification does not consume additional tokens.
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Report ID / QR */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <h3 className="text-sm font-medium text-[#111111] mb-3">Report Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Report ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm text-[#111111]">
                    {report.report_id || report.id.slice(0, 12)}
                  </p>
                  <button
                    onClick={() => copyToClipboard(report.report_id || report.id, 'Report ID')}
                    className="p-1 text-[#555555] hover:text-[#111111] transition-colors"
                    title="Copy Report ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Created</p>
                <p className="text-sm text-[#111111]">{formatDate(report.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Device Type</p>
                <p className="text-sm text-[#111111]">{report.device_type || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {report.qr_status === 'active' && (
            <div className="bg-white border border-[#E5E5E5] rounded p-6 text-center">
              <h3 className="text-sm font-medium text-[#111111] mb-3 flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4 text-[#555555]" />
                QR Code
              </h3>
              <div className="bg-white border-2 border-[#111111] rounded p-4 inline-block mx-auto">
                <div className="grid grid-cols-5 gap-1">
                  {[...Array(25)].map((_, i) => {
                    const isBlack = [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24].includes(i)
                    return (
                      <div key={i} className={`w-4 h-4 ${isBlack ? 'bg-[#111111]' : 'bg-white'}`} />
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-[#555555] mt-3">
                Scan to verify this report
              </p>
              <Link
                to={`/verify/${report.report_id || report.id}`}
                target="_blank"
                className="inline-block mt-3 text-sm text-[#555555] hover:text-[#111111] transition-colors"
              >
                View public verification →
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-[#E5E5E5] rounded p-4">
            <h3 className="text-sm font-medium text-[#111111] mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard(report.report_id || report.id, 'Report ID')}
                className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Report ID
              </button>
              {report.qr_status === 'active' && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/verify/${report.report_id || report.id}`
                    copyToClipboard(url, 'Verification URL')
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Copy Verification URL
                </button>
              )}
              <Link
                to={`/verify/${report.report_id || report.id}`}
                target="_blank"
                className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Public Report
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DealerReportDetails