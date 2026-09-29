import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { Search, ChevronLeft, ChevronRight, User, Mail, Phone, Building, X } from 'lucide-react'
import toast from 'react-hot-toast'

const DealersList = () => {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)

  // Fetch data when page or activeSearch changes
  useEffect(() => {
    fetchDealers()
  }, [page, activeSearch])

  // Handle search input change with debounce - slower (1000ms)
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    isTypingRef.current = true
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout - 1000ms delay (1 second)
    searchTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      const trimmedValue = value.trim()
      if (trimmedValue !== activeSearch) {
        setActiveSearch(trimmedValue)
        setPage(1)
      }
    }, 1000) // Increased to 1000ms
  }

  // Handle manual search (button click or Enter key)
  const handleManualSearch = () => {
    // Clear any pending timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    isTypingRef.current = false
    const trimmedValue = searchInput.trim()
    if (trimmedValue !== activeSearch) {
      setActiveSearch(trimmedValue)
      setPage(1)
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualSearch()
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchInput('')
    setActiveSearch('')
    setPage(1)
    isTypingRef.current = false
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  const fetchDealers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      if (activeSearch) {
        query = query.or(`email.ilike.%${activeSearch}%,full_name.ilike.%${activeSearch}%,business_name.ilike.%${activeSearch}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      setDealers(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching dealers:', error)
      toast.error('Failed to load dealers')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (!status) return <span className="text-xs text-[#555555]">Pending</span>
    const colors = {
      active: 'text-green-600 bg-green-50',
      suspended: 'text-red-600 bg-red-50',
      inactive: 'text-gray-500 bg-gray-100'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[status] || 'text-gray-500 bg-gray-100'}`}>
        {status}
      </span>
    )
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
          <h1 className="text-2xl font-bold text-[#111111]">Dealers</h1>
          <p className="text-sm text-[#555555]">Manage all VectorDDK dealer accounts</p>
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
                placeholder="Search by name, email, or business..."
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
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Business</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {dealers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No dealers found matching your search' : 'No dealers found'}
                  </td>
                </tr>
              ) : (
                dealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-[#555555]" />
                        </div>
                        <span className="font-medium text-[#111111]">{dealer.full_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#555555]">{dealer.business_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[#555555] text-xs">
                          <Mail className="w-3 h-3" />
                          {dealer.email}
                        </div>
                        {dealer.phone && (
                          <div className="flex items-center gap-1 text-[#555555] text-xs">
                            <Phone className="w-3 h-3" />
                            {dealer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(dealer.status)}</td>
                    <td className="px-4 py-3 text-[#555555] text-xs">
                      {dealer.created_at ? new Date(dealer.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/dealers/${dealer.id}`}
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

export default DealersList