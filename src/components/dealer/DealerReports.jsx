import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Filter,
  X,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

const DealerReports = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterDeviceType, setFilterDeviceType] = useState('all')
  const [filterResult, setFilterResult] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [dealerId, setDealerId] = useState(null)
  const pageSize = 10
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchDealerId()
  }, [])

  useEffect(() => {
    if (dealerId) {
      fetchReports()
    }
  }, [page, activeSearch, filterDeviceType, filterResult, filterDate, dealerId])

  const fetchDealerId = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

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
    } catch (error) {
      console.error('Error fetching dealer ID:', error)
    }
  }

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
    }, 500)
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

  const clearFilters = () => {
    setFilterDeviceType('all')
    setFilterResult('all')
    setFilterDate('all')
    setPage(1)
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false })

      if (activeSearch) {
        query = query.or(`report_id.ilike.%${activeSearch}%,device_manufacturer.ilike.%${activeSearch}%,device_model.ilike.%${activeSearch}%,serial_number.ilike.%${activeSearch}%`)
      }

      if (filterDeviceType !== 'all') {
        query = query.eq('device_type', filterDeviceType)
      }

      if (filterResult !== 'all') {
        query = query.eq('overall_result', filterResult.toUpperCase())
      }

      if (filterDate !== 'all') {
        const now = new Date()
        let startDate
        switch (filterDate) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7))
            break
          case 'month':
            startDate = new Date(now.setDate(now.getDate() - 30))
            break
          default:
            startDate = null
        }
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString())
        }
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setReports([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      setReports(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
      setTotalPages(0)
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

  const getStatusBadge = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-50',
      inactive: 'text-gray-500 bg-gray-100',
      expired: 'text-red-600 bg-red-50'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[status] || 'text-gray-500 bg-gray-100'}`}>
        {status || 'Active'}
      </span>
    )
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasActiveFilters = filterDeviceType !== 'all' || filterResult !== 'all' || filterDate !== 'all' || activeSearch

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111111]">Reports</h1>
        <p className="text-sm text-[#555555]">View all your diagnostic reports</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#E5E5E5] rounded p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by Report ID, Device, or Serial..."
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
          <button
            onClick={handleManualSearch}
            className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#555555]" />
            <span className="text-xs text-[#555555] font-medium">Filters:</span>
          </div>

          <select
            value={filterDeviceType}
            onChange={(e) => { setFilterDeviceType(e.target.value); setPage(1) }}
            className="px-3 py-1.5 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white"
          >
            <option value="all">All Types</option>
            <option value="laptop">Laptop</option>
            <option value="smartphone">Smartphone</option>
          </select>

          <select
            value={filterResult}
            onChange={(e) => { setFilterResult(e.target.value); setPage(1) }}
            className="px-3 py-1.5 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white"
          >
            <option value="all">All Results</option>
            <option value="pass">PASS</option>
            <option value="fail">FAIL</option>
          </select>

          <select
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1) }}
            className="px-3 py-1.5 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#555555] hover:text-[#111111] transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {activeSearch && (
          <div className="mt-2 text-xs text-[#555555]">
            Showing results for: <span className="font-medium text-[#111111]">"{activeSearch}"</span>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F6F6] border-b border-[#E5E5E5]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Report ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Result</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Created</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Verifications</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch || hasActiveFilters ? 'No reports found matching your criteria' : 'No customer-verifiable reports have been generated yet.'}
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#F6F6F6] transition-colors cursor-pointer" onClick={() => navigate(`/dealer/reports/${report.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-[#555555]">
                      {report.report_id || report.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#111111]">{report.device_manufacturer || 'Unknown'}</span>
                      <span className="text-[#555555] text-xs block">{report.device_model || ''}</span>
                    </td>
                    <td className="px-4 py-3 text-[#555555]">{report.device_type || 'N/A'}</td>
                    <td className="px-4 py-3">{getResultBadge(report.overall_result)}</td>
                    <td className="px-4 py-3 text-[#555555] text-xs">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center text-[#555555]">{report.verification_count || 0}</td>
                    <td className="px-4 py-3">{getStatusBadge(report.qr_status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/dealer/reports/${report.id}`}
                        className="text-sm text-[#555555] hover:text-[#111111] transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

export default DealerReports