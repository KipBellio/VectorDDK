import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'

const PaymentsList = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchPayments()
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

  const fetchPayments = async () => {
    setLoading(true)
    try {
      // Check if table has data first
      const { count: totalCount, error: countError } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })

      if (countError || totalCount === 0) {
        console.log('No payments found')
        setPayments([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      let query = supabase
        .from('payments')
        .select('*', { count: 'exact' })

      if (activeSearch) {
        query = query.or(`mpesa_reference.ilike.%${activeSearch}%,id.ilike.%${activeSearch}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setPayments([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      setPayments(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-50',
      pending: 'text-yellow-600 bg-yellow-50',
      failed: 'text-red-600 bg-red-50',
      cancelled: 'text-gray-500 bg-gray-100',
      refunded: 'text-orange-600 bg-orange-50'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[status] || 'text-gray-500 bg-gray-100'}`}>
        {status || 'Pending'}
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
          <h1 className="text-2xl font-bold text-[#111111]">Payments</h1>
          <p className="text-sm text-[#555555]">View all payment transactions</p>
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
                placeholder="Search by Reference or ID..."
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
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Payment ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Dealer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No payments found matching your search' : 'No payments found'}
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#555555]">
                      {payment.id?.slice(0, 8) || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-[#555555]">Dealer ID: {payment.dealer_id?.slice(0, 8) || 'N/A'}</td>
                    <td className="px-4 py-3 font-medium text-[#111111]">
                      KSh {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-[#555555] text-xs font-mono">
                      {payment.mpesa_reference || 'N/A'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3 text-[#555555] text-xs">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
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

export default PaymentsList