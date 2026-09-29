import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Download, 
  CheckCircle, 
  Info,
  Monitor,
  Wifi,
  Clock,
  FileText,
  Package,
  Smartphone,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

const DealerDownload = () => {
  const [loading, setLoading] = useState(false)
  const [downloadHistory, setDownloadHistory] = useState([])
  const [versions, setVersions] = useState([])
  const [dealerId, setDealerId] = useState(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            setFetching(false)
            return
        }

        const userId = session.user.id

        // Get dealer record directly using profile_id = userId
        const { data: dealer, error: dealerError } = await supabase
            .from('dealers')
            .select('id')
            .eq('profile_id', userId)
            .maybeSingle()

        if (dealerError) {
            console.error('Dealer fetch error:', dealerError)
            setFetching(false)
            return
        }

        if (dealer) {
            console.log('Dealer ID found:', dealer.id)
            setDealerId(dealer.id)

            // Get download history
            const { data: history, error: historyError } = await supabase
                .from('ddk_downloads')
                .select('*, software_versions!left(version, release_date, file_size)')
                .eq('dealer_id', dealer.id)
                .order('downloaded_at', { ascending: false })
                .limit(5)

            if (historyError) {
                console.error('History fetch error:', historyError)
            }

            setDownloadHistory(history || [])
        } else {
            console.error('No dealer found for user:', userId)
        }

        // Get all active versions
        const { data: versionData, error: versionError } = await supabase
            .from('software_versions')
            .select('*')
            .eq('status', 'active')
            .order('release_date', { ascending: false })

        if (versionError) {
            console.error('Version fetch error:', versionError)
        }

        setVersions(versionData || [])

    } catch (error) {
        console.error('Error fetching data:', error)
    } finally {
        setFetching(false)
    }
  }

  const handleDownload = async (version) => {
    if (!version) {
      toast.error('No version selected')
      return
    }

    if (!version.download_url) {
      toast.error('No download URL available for this version')
      return
    }

    setLoading(true)
    try {
      // Record download
      if (dealerId && version) {
        const { error } = await supabase
          .from('ddk_downloads')
          .insert([{
            dealer_id: dealerId,
            version_id: version.id,
            ip_address: null,
            user_agent: navigator.userAgent,
            downloaded_at: new Date().toISOString()
          }])

        if (error) {
          console.error('Download record error:', error)
        } else {
          // Refresh history
          const { data: history } = await supabase
            .from('ddk_downloads')
            .select('*, software_versions!left(version, release_date, file_size)')
            .eq('dealer_id', dealerId)
            .order('downloaded_at', { ascending: false })
            .limit(5)

          setDownloadHistory(history || [])
        }
      }

      // Open download URL in new tab
      window.open(version.download_url, '_blank')
      toast.success(`Download started for version ${version.version}!`)

    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const latestVersion = versions.length > 0 ? versions[0] : null

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#555555]" />
          <div>
            <h1 className="text-2xl font-bold text-[#111111]">Download DDK</h1>
            <p className="text-sm text-[#555555]">Download the VectorDDK Diagnostic Kit for Windows</p>
          </div>
        </div>
      </div>

      {/* Main Download Section - Latest Version */}
      {latestVersion && (
        <div className="bg-white border border-[#E5E5E5] rounded p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#111111] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">V</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#111111]">DDK {latestVersion.version}</h2>
                  <div className="flex items-center gap-2 text-sm text-[#555555]">
                    <span>Version {latestVersion.version}</span>
                    <span className="text-green-600">• Stable</span>
                    {latestVersion.file_size && (
                      <span className="text-[#555555]">• {formatFileSize(latestVersion.file_size)}</span>
                    )}
                  </div>
                </div>
              </div>
              {latestVersion.release_notes && (
                <div className="mt-3 p-3 bg-[#F6F6F6] rounded text-sm text-[#555555]">
                  <p className="text-xs font-medium text-[#555555] uppercase tracking-wider mb-1">Release Notes</p>
                  <p className="whitespace-pre-wrap">{latestVersion.release_notes}</p>
                </div>
              )}
              <p className="text-[#555555] mt-3 max-w-lg">
                VectorDDK Diagnostic Kit for Windows — Professional device diagnostics for laptops and smartphones.
              </p>
            </div>
            <button
              onClick={() => handleDownload(latestVersion)}
              disabled={loading || !latestVersion.download_url}
              className="px-8 py-3 bg-[#111111] hover:bg-[#222222] text-white font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {loading ? 'Starting...' : `Download DDK ${latestVersion.version}`}
            </button>
          </div>
        </div>
      )}

      {/* All Versions */}
      {versions.length > 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#111111] mb-3">Other Versions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {versions.slice(1).map((version) => (
              <div key={version.id} className="bg-white border border-[#E5E5E5] rounded p-4 hover:shadow-md transition-shadow flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111111]">v{version.version}</span>
                    <span className="text-xs text-[#555555]">
                      {version.release_date ? formatDate(version.release_date) : ''}
                    </span>
                  </div>
                  {version.file_size && (
                    <span className="text-xs text-[#555555]">{formatFileSize(version.file_size)}</span>
                  )}
                  {version.release_notes && (
                    <p className="text-xs text-[#555555] mt-1 line-clamp-1">{version.release_notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(version)}
                  disabled={loading || !version.download_url}
                  className="px-4 py-1.5 bg-[#111111] hover:bg-[#222222] text-white text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Requirements */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <h3 className="text-sm font-semibold text-[#111111] mb-4">System Requirements</h3>
          <ul className="space-y-2 text-sm text-[#555555]">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Windows 10 or later (64-bit)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Internet connection for authentication
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              USB connectivity for supported phone diagnostics
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              100 MB available disk space
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <h3 className="text-sm font-semibold text-[#111111] mb-4">What's Included</h3>
          <ul className="space-y-2 text-sm text-[#555555]">
            <li className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#555555] flex-shrink-0" />
              Laptop Diagnostics — Full hardware and software testing
            </li>
            <li className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#555555] flex-shrink-0" />
              Phone Diagnostics — Comprehensive device analysis
            </li>
            <li className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-[#555555] flex-shrink-0" />
              Device Connectivity — USB and wireless support
            </li>
            <li className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#555555] flex-shrink-0" />
              Customer-Ready Reports — Professional diagnostic reports
            </li>
          </ul>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-[#F6F6F6] border border-[#E5E5E5] rounded p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#555555] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[#555555]">
            <strong className="text-[#111111]">Important:</strong> You must have an active VectorDDK account to use DDK. 
            The application requires an internet connection for authentication and account-related functionality.
          </p>
        </div>
      </div>

      {/* Download History */}
      {downloadHistory.length > 0 && (
        <div className="bg-white border border-[#E5E5E5] rounded p-6">
          <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#555555]" />
            Download History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#E5E5E5]">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Version</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Downloaded</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#555555] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {downloadHistory.map((record, index) => (
                  <tr key={index} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-[#111111]">
                      {record.software_versions?.version || 'v1.0.0'}
                    </td>
                    <td className="px-3 py-2 text-[#555555] text-xs">
                      {record.downloaded_at ? new Date(record.downloaded_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Success</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {versions.length === 0 && (
        <div className="bg-white border border-[#E5E5E5] rounded p-12 text-center">
          <Package className="w-16 h-16 text-[#555555] mx-auto mb-4" />
          <p className="text-[#555555]">No versions available for download</p>
          <p className="text-sm text-[#555555]">Please check back later</p>
        </div>
      )}
    </div>
  )
}

export default DealerDownload