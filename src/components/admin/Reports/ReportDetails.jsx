import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
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
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

const ReportDetails = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [dealer, setDealer] = useState(null)

  useEffect(() => {
    fetchReportDetails()
  }, [id])

  const fetchReportDetails = async () => {
    setLoading(true)
    try {
      // Fetch report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (reportError) throw reportError
      setReport(reportData)

      // Fetch dealer info
      if (reportData.dealer_id) {
        const { data: dealerData } = await supabase
          .from('profiles')
          .select('full_name, email, business_name, phone')
          .eq('id', reportData.dealer_id)
          .single()
        setDealer(dealerData)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  const getResultBadge = (result) => {
    if (!result) return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">PENDING</span>
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
        <Link to="/admin/reports" className="text-sm text-[#555555] hover:text-[#111111] mt-2 inline-block">
          ← Back to reports
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/reports" className="text-[#555555] hover:text-[#111111]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Report Details</h1>
          <p className="text-sm text-[#555555]">View complete diagnostic report information</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Header */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  {getDeviceIcon(report.device_type)}
                  <h2 className="text-xl font-bold text-[#111111]">
                    {report.device_manufacturer || 'Unknown'} {report.device_model || 'Device'}
                  </h2>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-[#555555]">Report ID: {report.report_id || report.id?.slice(0, 8)}</span>
                  <span className="text-xs text-[#555555]">•</span>
                  <span className="text-xs text-[#555555]">Type: {report.device_type || 'N/A'}</span>
                  <span className="text-xs text-[#555555]">•</span>
                  {getResultBadge(report.overall_result)}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#555555]">QR Status:</span>
                  {getStatusBadge(report.qr_status)}
                </div>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <Eye className="w-3 h-3 text-[#555555]" />
                  <span className="text-xs text-[#555555]">{report.verification_count || 0} verifications</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dealer Info */}
          {dealer && (
            <div className="bg-white border border-[#E5E5E5] rounded p-6">
              <h3 className="text-sm font-medium text-[#111111] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#555555]" />
                Dealer Information
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-[#555555] uppercase tracking-wider">Name</span>
                  <p className="text-[#111111] font-medium">{dealer.full_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-[#555555] uppercase tracking-wider">Business</span>
                  <p className="text-[#111111] font-medium">{dealer.business_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-[#555555] uppercase tracking-wider">Email</span>
                  <p className="text-[#111111]">{dealer.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-[#555555] uppercase tracking-wider">Phone</span>
                  <p className="text-[#111111]">{dealer.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Results */}
          <div className="bg-white border border-[#E5E5E5] rounded p-6">
            <h3 className="text-sm font-medium text-[#111111] mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#555555]" />
              Diagnostic Results
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {report.diagnostic_results ? (
                Object.entries(report.diagnostic_results).map(([key, value]) => (
                  <div key={key} className="border border-[#E5E5E5] rounded p-3">
                    <p className="text-xs text-[#555555] uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium text-[#111111] mt-0.5">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-[#555555] text-sm">
                  No diagnostic results available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Report Metadata */}
          <div className="bg-white border border-[#E5E5E5] rounded p-4">
            <h3 className="text-sm font-medium text-[#111111] mb-3">Report Metadata</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Created</p>
                <p className="text-[#111111]">{report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Last Updated</p>
                <p className="text-[#111111]">{report.updated_at ? new Date(report.updated_at).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Serial Number</p>
                <p className="text-[#111111] font-mono text-sm">{report.serial_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#E5E5E5] rounded p-4">
            <h3 className="text-sm font-medium text-[#111111] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report.report_id || report.id)
                  toast.success('Report ID copied!')
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors"
              >
                Copy Report ID
              </button>
              {report.qr_status === 'active' && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/verify/${report.report_id || report.id}`
                    navigator.clipboard.writeText(url)
                    toast.success('Verification URL copied!')
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
                className="w-full text-left px-3 py-2 text-sm text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors block"
              >
                View Public Report →
              </Link>
            </div>
          </div>

          {/* QR Status */}
          <div className="bg-white border border-[#E5E5E5] rounded p-4">
            <h3 className="text-sm font-medium text-[#111111] mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#555555]" />
              QR Status
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#555555]">Status</span>
              {getStatusBadge(report.qr_status)}
            </div>
            {report.qr_status === 'active' && (
              <div className="mt-3 p-2 bg-[#F6F6F6] rounded text-center">
                <p className="text-xs text-[#555555]">This report is available for verification</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportDetails