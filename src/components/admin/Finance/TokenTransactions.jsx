import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react'

const TokenTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')
  const pageSize = 20
  
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchTransactions()
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

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // Check if table has data first
      const { count: totalCount, error: countError } = await supabase
        .from('token_transactions')
        .select('*', { count: 'exact', head: true })

      if (countError || totalCount === 0) {
        console.log('No token transactions found')
        setTransactions([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      let query = supabase
        .from('token_transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (activeSearch) {
        query = query.or(`dealer_id::text.ilike.%${activeSearch}%,reference_id.ilike.%${activeSearch}%,reason.ilike.%${activeSearch}%`)
      }

      if (filter !== 'all') {
        query = query.eq('transaction_type', filter)
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setTransactions([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      setTransactions(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type) => {
    const colors = {
      'PURCHASE': 'text-green-600 bg-green-50',
      'REPORT_GENERATION': 'text-blue-600 bg-blue-50',
      'ADMIN_ADJUSTMENT': 'text-purple-600 bg-purple-50',
      'REFUND': 'text-orange-600 bg-orange-50',
      'PROMOTIONAL': 'text-indigo-600 bg-indigo-50'
    }
    const labels = {
      'PURCHASE': 'Purchase',
      'REPORT_GENERATION': 'Report Generation',
      'ADMIN_ADJUSTMENT': 'Admin Adjustment',
      'REFUND': 'Refund',
      'PROMOTIONAL': 'Promotional'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[type] || 'text-gray-500 bg-gray-100'}`}>
        {labels[type] || type}
      </span>
    )
  }

  const getAmountDisplay = (amount, type) => {
    const isNegative = ['REPORT_GENERATION', 'REFUND'].includes(type)
    const color = isNegative ? 'text-red-600' : 'text-green-600'
    const icon = isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
    return (
      <span className={`flex items-center gap-1 ${color}`}>
        {icon}
        {isNegative ? '-' : '+'}{Math.abs(amount)}
      </span>
    )
  }

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'PURCHASE', label: 'Purchases' },
    { value: 'REPORT_GENERATION', label: 'Report Generation' },
    { value: 'ADMIN_ADJUSTMENT', label: 'Admin Adjustments' },
    { value: 'REFUND', label: 'Refunds' },
    { value: 'PROMOTIONAL', label: 'Promotional' }
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
          <h1 className="text-2xl font-bold text-[#111111]">Token Transactions</h1>
          <p className="text-sm text-[#555555]">View all token transactions across the system</p>
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
              placeholder="Search by dealer ID, reference, or reason..."
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
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Balance After</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No token transactions found matching your search' : 'No token transactions found'}
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3">
                      {getTypeBadge(transaction.transaction_type)}
                      {transaction.dealer_id && (
                        <div className="text-xs text-[#555555] mt-0.5">
                          Dealer: {transaction.dealer_id.slice(0, 8)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getAmountDisplay(transaction.amount, transaction.transaction_type)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#111111]">{transaction.balance_after}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555555] font-mono">
                      {transaction.reference_id || transaction.reason || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555555] whitespace-nowrap">
                      {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'N/A'}
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

export default TokenTransactions