import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  FileText,
  CreditCard,
  LogIn,
  LogOut,
  Filter,
  User,
  X
} from 'lucide-react'

const DealerActivity = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchActivities()
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

  const fetchActivities = async () => {
    setLoading(true)
    try {
        // Check if table has data first
        const { count: totalCount, error: countError } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })

        if (countError || totalCount === 0) {
            console.log('No activity data found')
            setActivities([])
            setTotalPages(0)
            setLoading(false)
            return
        }

        // Fetch paginated data
        let query = supabase
            .from('activity_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        // ✅ FIXED: Handle search with spaces properly
        if (activeSearch) {
            // Use textSearch for action column
            query = query.ilike('action', `%${activeSearch}%`)
        }

        if (filter !== 'all') {
            query = query.eq('action', filter)
        }

        const { data, error, count } = await query
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) {
            console.error('Query error:', error)
            setActivities([])
            setTotalPages(0)
            setLoading(false)
            return
        }

        setActivities(data || [])
        setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
        console.error('Error fetching activities:', error)
        setActivities([])
        setTotalPages(0)
    } finally {
        setLoading(false)
    }
}

  const getActionIcon = (action) => {
    const icons = {
      'login': <LogIn className="w-4 h-4" />,
      'logout': <LogOut className="w-4 h-4" />,
      'report_generated': <FileText className="w-4 h-4" />,
      'token_purchase': <CreditCard className="w-4 h-4" />,
      'report_verified': <FileText className="w-4 h-4" />
    }
    return icons[action] || <Activity className="w-4 h-4" />
  }

  const getActionColor = (action) => {
    const colors = {
      'login': 'text-green-600',
      'logout': 'text-red-600',
      'report_generated': 'text-blue-600',
      'token_purchase': 'text-purple-600',
      'report_verified': 'text-indigo-600'
    }
    return colors[action] || 'text-gray-600'
  }

  const getActionLabel = (action) => {
    const labels = {
      'login': 'Logged In',
      'logout': 'Logged Out',
      'report_generated': 'Generated Report',
      'token_purchase': 'Purchased Tokens',
      'report_verified': 'Verified Report'
    }
    return labels[action] || action
  }

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'login', label: 'Logins' },
    { value: 'logout', label: 'Logouts' },
    { value: 'report_generated', label: 'Reports Generated' },
    { value: 'token_purchase', label: 'Token Purchases' },
    { value: 'report_verified', label: 'Reports Verified' }
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
          <h1 className="text-2xl font-bold text-[#111111]">Dealer Activity</h1>
          <p className="text-sm text-[#555555]">Monitor all dealer actions and events</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by action or details..."
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
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Details</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No activity found matching your search' : 'No activity found'}
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-2 ${getActionColor(activity.action)}`}>
                        {getActionIcon(activity.action)}
                        <span className="text-xs font-medium">{getActionLabel(activity.action)}</span>
                      </div>
                      {activity.dealer_id && (
                        <div className="text-xs text-[#555555] mt-0.5">
                          Dealer ID: {activity.dealer_id.slice(0, 8)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {activity.details ? (
                        <div className="text-xs text-[#555555] max-w-xs truncate">
                          {typeof activity.details === 'string' 
                            ? activity.details 
                            : Object.entries(activity.details).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  <span className="font-medium">{key}:</span>
                                  <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                </span>
                              ))
                          }
                        </div>
                      ) : (
                        <span className="text-xs text-[#555555]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555555] whitespace-nowrap">
                      {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'N/A'}
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

export default DealerActivity