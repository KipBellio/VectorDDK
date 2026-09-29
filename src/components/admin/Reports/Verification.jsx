import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  QrCode,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  X,
  Smartphone,
  Laptop,
  Monitor,
  AlertCircle,
} from 'lucide-react'

const Verification = () => {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all') // all, qr_code, manual_entry
  const [stats, setStats] = useState({
    totalVerifications: 0,
    qrVerifications: 0,
    manualVerifications: 0,
    uniqueReports: 0
  })
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchVerifications()
  }, [page, activeSearch, filter])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      const trimmedValue = value.trim()
      if (trimmedValue !== activeSearch) {
        setActiveSearch(trimmedValue)
        setPage(1)
      }
    }, 1000)
  }

  const handleManualSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    const trimmedValue = searchInput.trim()
    if (trimmedValue !== activeSearch) {
      setActiveSearch(trimmedValue)
      setPage(1)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualSearch()
    }
  }

  const clearSearch = () => {
    setSearchInput('')
    setActiveSearch('')
    setPage(1)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      // Step 1: Get all reports with their verification counts
      let reportsQuery = supabase
        .from('reports')
        .select(`
          id,
          report_id,
          dealer_id,
          device_type,
          device_manufacturer,
          device_model,
          verification_count,
          qr_status,
          created_at,
          updated_at
        `)
        .gt('verification_count', 0)
        .order('updated_at', { ascending: false })

      if (activeSearch) {
        reportsQuery = reportsQuery.or(
          `report_id.ilike.%${activeSearch}%,` +
          `device_manufacturer.ilike.%${activeSearch}%,` +
          `device_model.ilike.%${activeSearch}%`
        )
      }

      const { data: reportsData, error: reportsError, count: reportsCount } = await reportsQuery
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (reportsError) {
        console.error('Reports query error:', reportsError)
        setVerifications([])
        setTotalPages(0)
        setStats({
          totalVerifications: 0,
          qrVerifications: 0,
          manualVerifications: 0,
          uniqueReports: 0
        })
        setLoading(false)
        return
      }

      if (!reportsData || reportsData.length === 0) {
        console.log('No reports with verifications found')
        setVerifications([])
        setTotalPages(0)
        setStats({
          totalVerifications: 0,
          qrVerifications: 0,
          manualVerifications: 0,
          uniqueReports: 0
        })
        setLoading(false)
        return
      }

      // Step 2: Get QR scan data for these reports
      const reportIds = reportsData.map(r => r.id)
      
      let scansQuery = supabase
        .from('qr_scans')
        .select('*')
        .in('qr_verification_id', reportIds)
        .order('scanned_at', { ascending: false })

      const { data: scansData, error: scansError } = await scansQuery

      if (scansError) {
        console.error('QR scans query error:', scansError)
        // Continue without scan data - we'll still show reports
      }

      // Step 3: Combine the data
      const combinedData = reportsData.map(report => {
        // Get all scans for this report
        const scans = scansData?.filter(s => s.qr_verification_id === report.id) || []
        
        // Determine if this report has QR scans or manual entries
        const hasQrScans = scans.some(s => s.scan_method === 'qr_code')
        const hasManualScans = scans.some(s => s.scan_method === 'manual_entry')
        
        // Determine the primary verification method
        let primaryMethod = 'unknown'
        if (hasQrScans && hasManualScans) {
          primaryMethod = 'both'
        } else if (hasQrScans) {
          primaryMethod = 'qr_code'
        } else if (hasManualScans) {
          primaryMethod = 'manual_entry'
        } else {
          // If no scans found, use the verification_count to determine
          // If verification_count > 0 but no scans, it was manually verified
          primaryMethod = report.verification_count > 0 ? 'manual_entry' : 'unknown'
        }

        // Get the most recent scan
        const latestScan = scans.length > 0 ? scans.reduce((a, b) => 
          new Date(a.scanned_at) > new Date(b.scanned_at) ? a : b
        ) : null

        return {
          id: report.id,
          report_id: report.report_id,
          dealer_id: report.dealer_id,
          device_type: report.device_type,
          device_manufacturer: report.device_manufacturer,
          device_model: report.device_model,
          verification_count: report.verification_count,
          qr_status: report.qr_status,
          created_at: report.created_at,
          updated_at: report.updated_at,
          // QR scan specific fields
          scan_method: primaryMethod,
          has_qr_scans: hasQrScans,
          has_manual_scans: hasManualScans,
          scan_count: scans.length,
          ip_address: latestScan?.ip_address || '—',
          scanned_at: latestScan?.scanned_at || report.updated_at,
          user_agent: latestScan?.user_agent || null,
          location: latestScan?.location || null,
          scans: scans // Keep all scans for detailed view
        }
      })

      // Step 4: Apply filter if needed
      let filteredData = combinedData
      if (filter === 'qr_code') {
        filteredData = combinedData.filter(v => v.has_qr_scans)
      } else if (filter === 'manual_entry') {
        filteredData = combinedData.filter(v => !v.has_qr_scans && v.verification_count > 0)
      }

      setVerifications(filteredData)
      setTotalPages(Math.ceil((reportsCount || 0) / pageSize))

      // Calculate stats
      const total = filteredData.length
      const qr = filteredData.filter(v => v.has_qr_scans).length
      const manual = filteredData.filter(v => !v.has_qr_scans && v.verification_count > 0).length
      const unique = new Set(filteredData.map(v => v.id)).size

      setStats({
        totalVerifications: total,
        qrVerifications: qr,
        manualVerifications: manual,
        uniqueReports: unique
      })

    } catch (error) {
      console.error('Error fetching verifications:', error)
      setVerifications([])
      setTotalPages(0)
      setStats({
        totalVerifications: 0,
        qrVerifications: 0,
        manualVerifications: 0,
        uniqueReports: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getMethodBadge = (verification) => {
    if (verification.has_qr_scans && verification.has_manual_scans) {
      return (
        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded flex items-center gap-1">
          <QrCode className="w-3 h-3" />
          <Eye className="w-3 h-3" />
          Both
        </span>
      )
    }
    if (verification.has_qr_scans) {
      return (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
          <QrCode className="w-3 h-3" />
          QR Code
        </span>
      )
    }
    if (verification.verification_count > 0) {
      return (
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Manual Entry
        </span>
      )
    }
    return (
      <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Unknown
      </span>
    )
  }

  const getDeviceIcon = (deviceType) => {
    const type = deviceType?.toLowerCase() || ''
    if (type === 'laptop') return <Laptop className="w-4 h-4" />
    if (type === 'smartphone' || type === 'phone') return <Smartphone className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { icon: <CheckCircle className="w-3 h-3" />, color: 'text-green-600 bg-green-50' },
      'expired': { icon: <XCircle className="w-3 h-3" />, color: 'text-red-600 bg-red-50' },
      'pending': { icon: <Clock className="w-3 h-3" />, color: 'text-yellow-600 bg-yellow-50' },
      'warning': { icon: <AlertCircle className="w-3 h-3" />, color: 'text-orange-600 bg-orange-50' }
    }
    const s = statusMap[status?.toLowerCase()] || statusMap['pending']
    return <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${s.color}`}>{s.icon} {status || 'Pending'}</span>
  }

  const filterOptions = [
    { value: 'all', label: 'All Verifications' },
    { value: 'qr_code', label: 'QR Code Scans' },
    { value: 'manual_entry', label: 'Manual Entries' }
  ]

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
          <h1 className="text-2xl font-bold text-[#111111]">Report Verification</h1>
          <p className="text-sm text-[#555555]">Track and analyze report verifications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Total Verifications</p>
              <p className="text-2xl font-bold text-[#111111]">{stats.totalVerifications}</p>
            </div>
            <Eye className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">QR Code Scans</p>
              <p className="text-2xl font-bold text-[#111111]">{stats.qrVerifications}</p>
            </div>
            <QrCode className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Manual Entries</p>
              <p className="text-2xl font-bold text-[#111111]">{stats.manualVerifications}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Unique Reports</p>
              <p className="text-2xl font-bold text-[#111111]">{stats.uniqueReports}</p>
            </div>
            <Users className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by report ID, device, or manufacturer..."
              className="w-full pl-10 pr-10 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] hover:text-[#111111] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualSearch}
              className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#555555]" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {activeSearch && (
          <div className="px-4 py-2 bg-[#F6F6F6] border-b border-[#E5E5E5] text-xs text-[#555555]">
            Showing results for: <span className="font-medium text-[#111111]">"{activeSearch}"</span>
            <button
              onClick={clearSearch}
              className="ml-2 text-[#555555] hover:text-[#111111] transition-colors"
            >
              (Clear)
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F6F6] border-b border-[#E5E5E5]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Report</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Method</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Scans</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No verifications found matching your search' : 'No verifications found'}
                  </td>
                </tr>
              ) : (
                verifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#111111]">
                          {verification.report_id?.slice(0, 12) || 'N/A'}
                        </span>
                        {verification.scan_count > 1 && (
                          <span className="text-xs text-[#555555] bg-[#F6F6F6] px-1.5 py-0.5 rounded">
                            {verification.scan_count} scans
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(verification.device_type)}
                        <div className="text-xs">
                          <div className="font-medium text-[#111111]">
                            {verification.device_manufacturer || 'Unknown'}
                          </div>
                          <div className="text-[#555555]">
                            {verification.device_model || 'Unknown Model'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getMethodBadge(verification)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#111111]">
                        {verification.verification_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(verification.qr_status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555555] whitespace-nowrap">
                      {verification.scanned_at ? new Date(verification.scanned_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#E5E5E5] flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm text-[#555555] hover:text-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[#555555]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm text-[#555555] hover:text-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Verification