import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  User,
  Calendar,
  Monitor,
  HardDrive,
  Filter,
  X,
  Package
} from 'lucide-react'

const DDKDownloads = () => {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    uniqueDealers: 0,
    latestDownload: null
  })
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchDownloads()
  }, [page, activeSearch])

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

  const fetchDownloads = async () => {
    setLoading(true)
    try {
      // Fetch downloads with dealer info and version info
      let query = supabase
        .from('ddk_downloads')
        .select(`
          *,
          dealers!left (
            id,
            business_name,
            profile_id,
            profiles!left (
              id,
              email,
              full_name,
              business_name
            )
          ),
          software_versions!left (
            version,
            release_date,
            file_size
          )
        `, { count: 'exact' })
        .order('downloaded_at', { ascending: false })

      if (activeSearch) {
        query = query.or(
          `ip_address.ilike.%${activeSearch}%,` +
          `dealers.business_name.ilike.%${activeSearch}%,` +
          `dealers.profiles.email.ilike.%${activeSearch}%,` +
          `software_versions.version.ilike.%${activeSearch}%`
        )
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setDownloads([])
        setTotalPages(0)
        setStats({ total: 0, uniqueDealers: 0, latestDownload: null })
        setLoading(false)
        return
      }

      setDownloads(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))

      // Calculate stats
      if (data && data.length > 0) {
        const uniqueDealers = new Set(data.map(d => d.dealer_id)).size
        setStats({
          total: count || 0,
          uniqueDealers: uniqueDealers,
          latestDownload: data[0]?.downloaded_at || null
        })
      } else {
        setStats({ total: 0, uniqueDealers: 0, latestDownload: null })
      }

    } catch (error) {
      console.error('Error fetching downloads:', error)
      setDownloads([])
      setTotalPages(0)
      setStats({ total: 0, uniqueDealers: 0, latestDownload: null })
    } finally {
      setLoading(false)
    }
  }

  const getVersionDisplay = (download) => {
    if (download.software_versions?.version) {
      return <span className="text-sm font-medium text-[#111111]">v{download.software_versions.version}</span>
    }
    return <span className="text-xs text-[#555555]">Unknown</span>
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">DDK Downloads</h1>
          <p className="text-sm text-[#555555]">Track software downloads by dealers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Total Downloads</p>
              <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
            </div>
            <Download className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Unique Dealers</p>
              <p className="text-2xl font-bold text-[#111111]">{stats.uniqueDealers}</p>
            </div>
            <User className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#555555] uppercase tracking-wider">Latest Download</p>
              <p className="text-sm font-medium text-[#111111]">{stats.latestDownload ? formatDate(stats.latestDownload) : 'N/A'}</p>
            </div>
            <Calendar className="w-5 h-5 text-[#555555]" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-[#E5E5E5]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Search by IP, Dealer, Email, or Version..."
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
          {activeSearch && (
            <div className="mt-2 text-xs text-[#555555]">
              Showing results for: <span className="font-medium text-[#111111]">"{activeSearch}"</span>
              <button
                onClick={clearSearch}
                className="ml-2 text-[#555555] hover:text-[#111111] transition-colors"
              >
                (Clear)
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F6F6] border-b border-[#E5E5E5]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Dealer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Downloaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {downloads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No download records found matching your search' : 'No download records found'}
                  </td>
                </tr>
              ) : (
                downloads.map((download) => {
                  const profile = download.dealers?.profiles
                  const dealerName = profile?.business_name || profile?.full_name || download.dealers?.business_name || 'Unknown Dealer'
                  const dealerEmail = profile?.email || 'No email'
                  
                  return (
                    <tr key={download.id} className="hover:bg-[#F6F6F6] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-[#555555]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#111111] text-sm">{dealerName}</p>
                            <p className="text-xs text-[#555555]">{dealerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#555555]" />
                          {getVersionDisplay(download)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#555555] font-mono">
                        {download.ip_address || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#555555] whitespace-nowrap">
                        {formatDate(download.downloaded_at)}
                      </td>
                    </tr>
                  )
                })
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

export default DDKDownloads