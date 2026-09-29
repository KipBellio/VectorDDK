import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  CheckCircle, 
  XCircle, 
  Loader, 
  Search,
  ArrowLeft,
  QrCode
} from 'lucide-react'
import ReportRenderer from '../ReportRenderer'

const VerifyReport = () => {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [inputId, setInputId] = useState('')

  useEffect(() => {
    if (reportId) {
      setInputId(reportId)
      fetchReport(reportId)
    }
  }, [reportId])

  const fetchReport = async (id) => {
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('report_id', id.trim())
        .maybeSingle()

      if (error || !data) {
        setError('Report not found. Please check the ID and try again.')
        setLoading(false)
        return
      }

      if (data.qr_status !== 'active') {
        setError('This report is no longer active for verification.')
        setLoading(false)
        return
      }

      // Increment verification count
      const newCount = (data.verification_count || 0) + 1
      
      await supabase
        .from('reports')
        .update({ 
          verification_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)

      // Log the scan
      await supabase
        .from('qr_scans')
        .insert([{
          report_id: data.id,
          scan_method: 'manual_entry',
          scanned_at: new Date().toISOString()
        }])

      setReport({
        ...data,
        verification_count: newCount
      })

    } catch (err) {
      console.error('Error fetching report:', err)
      setError('Could not verify report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputId.trim()) {
      navigate(`/verify/${inputId.trim()}`)
    }
  }

  // Show form when no reportId is in URL
  if (!reportId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50 pt-20">
        <div className="max-w-2xl w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#111111]">Verify a Report</h1>
            <p className="text-[#555555] mt-2">
              Have a VectorDDK report? Verify its authenticity instantly.
            </p>
          </div>

          <div className="mt-8 bg-white rounded-xl border border-[#E5E5E5] p-8 shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="text"
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  placeholder="Enter Report ID (e.g., VDDK-XXXXXXXX)"
                  className="flex-1 px-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Verify Report
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-[#555555]">
                OR scan the QR code on your report to verify it automatically.
              </p>
            </div>

            <div className="mt-4 flex justify-center">
              <div className="border-2 border-[#111111] rounded-lg p-4 inline-block bg-white">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="120" fill="white"/>
                  <rect x="8" y="8" width="24" height="24" fill="#111111"/>
                  <rect x="12" y="12" width="16" height="16" fill="white"/>
                  <rect x="16" y="16" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="24" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="24" width="8" height="8" fill="#111111"/>
                  <rect x="24" y="24" width="8" height="8" fill="#111111"/>
                  <rect x="88" y="8" width="24" height="24" fill="#111111"/>
                  <rect x="92" y="12" width="16" height="16" fill="white"/>
                  <rect x="96" y="16" width="8" height="8" fill="#111111"/>
                  <rect x="88" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="104" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="88" y="24" width="8" height="8" fill="#111111"/>
                  <rect x="104" y="24" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="88" width="24" height="24" fill="#111111"/>
                  <rect x="12" y="92" width="16" height="16" fill="white"/>
                  <rect x="16" y="96" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="88" width="8" height="8" fill="#111111"/>
                  <rect x="24" y="88" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="104" width="8" height="8" fill="#111111"/>
                  <rect x="24" y="104" width="8" height="8" fill="#111111"/>
                  <rect x="40" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="56" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="72" y="8" width="8" height="8" fill="#111111"/>
                  <rect x="40" y="16" width="8" height="8" fill="#111111"/>
                  <rect x="64" y="16" width="8" height="8" fill="#111111"/>
                  <rect x="48" y="24" width="8" height="8" fill="#111111"/>
                  <rect x="72" y="24" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="24" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="40" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="64" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="80" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="104" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="56" width="8" height="8" fill="#111111"/>
                  <rect x="24" y="56" width="8" height="8" fill="#111111"/>
                  <rect x="48" y="56" width="8" height="8" fill="#111111"/>
                  <rect x="64" y="56" width="8" height="8" fill="#111111"/>
                  <rect x="88" y="56" width="8" height="8" fill="#111111"/>
                  <rect x="8" y="72" width="8" height="8" fill="#111111"/>
                  <rect x="40" y="72" width="8" height="8" fill="#111111"/>
                  <rect x="56" y="72" width="8" height="8" fill="#111111"/>
                  <rect x="80" y="72" width="8" height="8" fill="#111111"/>
                  <rect x="104" y="72" width="8" height="8" fill="#111111"/>
                  <rect x="40" y="88" width="8" height="8" fill="#111111"/>
                  <rect x="56" y="88" width="8" height="8" fill="#111111"/>
                  <rect x="80" y="88" width="8" height="8" fill="#111111"/>
                  <rect x="48" y="104" width="8" height="8" fill="#111111"/>
                  <rect x="72" y="104" width="8" height="8" fill="#111111"/>
                  <rect x="88" y="104" width="8" height="8" fill="#111111"/>
                  <rect x="48" y="40" width="8" height="8" fill="#111111"/>
                  <rect x="72" y="48" width="8" height="8" fill="#111111"/>
                  <rect x="48" y="72" width="8" height="8" fill="#111111"/>
                  <rect x="72" y="88" width="8" height="8" fill="#111111"/>
                  <rect x="88" y="48" width="8" height="8" fill="#111111"/>
                  <rect x="104" y="56" width="8" height="8" fill="#111111"/>
                  <rect x="64" y="64" width="8" height="8" fill="#111111"/>
                  <rect x="40" y="104" width="8" height="8" fill="#111111"/>
                  <rect x="104" y="88" width="8" height="8" fill="#111111"/>
                </svg>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#555555] text-center mt-4">
            No account required. Customers can verify reports without logging in.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-[#111111] mx-auto" />
          <p className="text-[#555555] mt-4">Verifying report...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !report) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50 pt-20">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E5E5E5] p-8 shadow-sm text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#111111]">Verification Failed</h2>
          <p className="text-[#555555] mt-2">{error || 'This report could not be verified'}</p>
          <Link
            to="/verify"
            className="inline-block mt-6 px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try Another Report
          </Link>
        </div>
      </div>
    )
  }

  // Parse diagnostic_results if it's a string
  const diagnosticResults = report.diagnostic_results
    ? (typeof report.diagnostic_results === 'string'
        ? JSON.parse(report.diagnostic_results)
        : report.diagnostic_results)
    : null

  // Show report details
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50 pt-20">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#111111]">Verified Diagnostic Report</h1>
              <p className="text-sm text-[#555555]">Report ID: {report.report_id || report.id?.slice(0, 8)}</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">VERIFIED</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Device</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-[#111111] text-lg">
                  {report.device_manufacturer || 'Unknown'} {report.device_model || ''}
                </p>
                {diagnosticResults?.overall_grade && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      diagnosticResults.overall_grade === 'Good'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : diagnosticResults.overall_grade === 'Fair'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {diagnosticResults.overall_grade}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Serial Number</p>
              <p className="font-medium text-[#111111] font-mono">{report.serial_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Device Type</p>
              <p className="font-medium text-[#111111]">{report.device_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Test Date</p>
              <p className="font-medium text-[#111111]">
                {report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Dealer Info */}
          {report.dealer && (
            <div className="border-t border-[#E5E5E5] pt-4 mb-4">
              <h3 className="text-sm font-semibold text-[#111111] mb-2">Dealer Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-[#555555]">Business</span>
                  <p className="font-medium text-[#111111]">{report.dealer.business_name || 'N/A'}</p>
                </div>
                {report.dealer.profiles && (
                  <>
                    <div>
                      <span className="text-xs text-[#555555]">Contact Person</span>
                      <p className="font-medium text-[#111111]">{report.dealer.profiles.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#555555]">Email</span>
                      <p className="font-medium text-[#111111]">{report.dealer.profiles.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#555555]">Phone</span>
                      <p className="font-medium text-[#111111]">{report.dealer.profiles.phone || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {diagnosticResults && (
            <div className="border-t border-[#E5E5E5] pt-6 mb-6">
              <h3 className="text-sm font-semibold text-[#111111] mb-4">Diagnostic Results</h3>
              <ReportRenderer data={diagnosticResults} />
            </div>
          )}

          <div className="border-t border-[#E5E5E5] pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[#555555] uppercase tracking-wider">Overall Result</p>
                <p className={`text-xl font-bold ${report.overall_result?.toUpperCase() === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                  {report.overall_result || 'PENDING'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#555555] uppercase tracking-wider">Verification Count</p>
                <p className="text-xl font-bold text-[#111111]">{report.verification_count || 0}</p>
              </div>
            </div>

            <div className="bg-[#F6F6F6] rounded-lg p-4 text-center">
              <p className="text-sm text-[#555555]">
                This report was generated by <span className="font-medium text-[#111111]">VectorDDK</span> — Professional Device Diagnostics
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <CheckCircle className="w-4 h-4 text-[#111111]" />
                <span className="text-xs text-[#555555]">Verified and authentic</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E5E5E5] pt-6 mt-6 flex flex-wrap justify-between items-center gap-4">
            <Link
              to="/verify"
              className="text-sm text-[#555555] hover:text-[#111111] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Verify another report
            </Link>
            <Link
              to="/"
              className="text-sm text-[#555555] hover:text-[#111111] transition-colors"
            >
              Return to VectorDDK →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyReport