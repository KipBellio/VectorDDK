import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Filter,
  X
} from 'lucide-react'

const AuditLog = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchLogs()
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

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Check if table has data first
      const { count: totalCount, error: countError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      if (countError || totalCount === 0) {
        console.log('No audit logs found')
        setLogs([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (activeSearch) {
        query = query.or(`admin_email.ilike.%${activeSearch}%,action.ilike.%${activeSearch}%,target_type.ilike.%${activeSearch}%,target_id.ilike.%${activeSearch}%`)
      }

      if (filter !== 'all') {
        query = query.eq('action', filter)
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setLogs([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      setLogs(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setLogs([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action) => {
    const colors = {
      'dealer_activated': 'text-green-600 bg-green-50',
      'dealer_suspended': 'text-red-600 bg-red-50',
      'dealer_reactivated': 'text-blue-600 bg-blue-50',
      'tokens_added': 'text-green-600 bg-green-50',
      'tokens_removed': 'text-red-600 bg-red-50',
      'package_created': 'text-indigo-600 bg-indigo-50',
      'package_updated': 'text-indigo-600 bg-indigo-50',
      'package_deleted': 'text-red-600 bg-red-50',
      'settings_changed': 'text-yellow-600 bg-yellow-50',
      'admin_created': 'text-purple-600 bg-purple-50',
      'admin_updated': 'text-purple-600 bg-purple-50',
      'admin_deleted': 'text-red-600 bg-red-50',
      'login': 'text-blue-600 bg-blue-50',
      'logout': 'text-gray-600 bg-gray-100'
    }
    const labels = {
      'dealer_activated': 'Dealer Activated',
      'dealer_suspended': 'Dealer Suspended',
      'dealer_reactivated': 'Dealer Reactivated',
      'tokens_added': 'Tokens Added',
      'tokens_removed': 'Tokens Removed',
      'package_created': 'Package Created',
      'package_updated': 'Package Updated',
      'package_deleted': 'Package Deleted',
      'settings_changed': 'Settings Changed',
      'admin_created': 'Admin Created',
      'admin_updated': 'Admin Updated',
      'admin_deleted': 'Admin Deleted',
      'login': 'Login',
      'logout': 'Logout'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[action] || 'text-gray-500 bg-gray-100'}`}>
        {labels[action] || action}
      </span>
    )
  }

  const filterOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'dealer_activated', label: 'Dealer Activated' },
    { value: 'dealer_suspended', label: 'Dealer Suspended' },
    { value: 'dealer_reactivated', label: 'Dealer Reactivated' },
    { value: 'tokens_added', label: 'Tokens Added' },
    { value: 'tokens_removed', label: 'Tokens Removed' },
    { value: 'package_created', label: 'Package Created' },
    { value: 'package_updated', label: 'Package Updated' },
    { value: 'package_deleted', label: 'Package Deleted' },
    { value: 'settings_changed', label: 'Settings Changed' },
    { value: 'admin_created', label: 'Admin Created' },
    { value: 'admin_updated', label: 'Admin Updated' },
    { value: 'admin_deleted', label: 'Admin Deleted' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' }
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
          <h1 className="text-2xl font-bold text-[#111111]">Audit Log</h1>
          <p className="text-sm text-[#555555]">Track all administrative actions across the system</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        {/* Search and Filter */}
        <div className="p-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by admin, action, or target..."
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F6F6] border-b border-[#E5E5E5]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Target</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Details</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No audit logs found matching your search' : 'No audit logs found'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-[#555555]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#111111] text-sm">{log.admin_email}</p>
                          <p className="text-xs text-[#555555]">Admin ID: {log.admin_id?.slice(0, 8) || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-[#111111]">{log.target_type || 'N/A'}</p>
                        <p className="text-xs text-[#555555] font-mono">{log.target_id || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        {log.details ? (
                          <div className="text-xs text-[#555555]">
                            {typeof log.details === 'string' 
                              ? log.details 
                              : Object.entries(log.details).map(([key, value]) => (
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
                        {log.reason && (
                          <div className="mt-1 text-xs text-[#555555] bg-[#F6F6F6] p-1 rounded">
                            <span className="font-medium">Reason:</span> {log.reason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555555] whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
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

export default AuditLog