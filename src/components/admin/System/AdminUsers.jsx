import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  User,
  Mail,
  Shield,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminUsers = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'admin',
    password: ''
  })
  const pageSize = 20
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchAdmins()
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

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const { count: totalCount, error: countError } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true })

      if (countError || totalCount === 0) {
        console.log('No admin users found')
        setAdmins([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      let query = supabase
        .from('admin_users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (activeSearch) {
        query = query.or(`email.ilike.%${activeSearch}%,full_name.ilike.%${activeSearch}%`)
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setAdmins([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      setAdmins(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching admins:', error)
      setAdmins([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingAdmin) {
      setLoading(true)
      try {
        const updateData = {
          full_name: formData.full_name,
          role: formData.role
        }
        
        if (formData.status) {
          updateData.status = formData.status
        }

        const { error } = await supabase
          .from('admin_users')
          .update(updateData)
          .eq('id', editingAdmin.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        toast.success('Admin updated successfully!')
        
        setShowModal(false)
        setEditingAdmin(null)
        setFormData({ email: '', full_name: '', role: 'admin', password: '' })
        fetchAdmins()
      } catch (error) {
        console.error('Error updating admin:', error)
        toast.error('Failed to update admin user')
      } finally {
        setLoading(false)
      }
    } else {
      // Show instructions modal instead of trying to create
      setShowModal(false)
      setShowInstructions(true)
    }
  }

  const handleEdit = (admin) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      full_name: admin.full_name || '',
      role: admin.role,
      password: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this admin user?')) return

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Admin user removed successfully!')
      fetchAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast.error('Failed to remove admin user')
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      toast.success(`Admin ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchAdmins()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update admin status')
    }
  }

  const copySQL = () => {
    const sql = `-- Step 1: Create user in Supabase Dashboard (Authentication → Users → Add User)
-- Set email and password, then copy the user UUID

-- Step 2: Add to admin_users table
INSERT INTO admin_users (email, full_name, role, status)
VALUES ('newadmin@example.com', 'Full Name', 'admin', 'active');

-- Or if you have the UUID from auth.users:
INSERT INTO admin_users (id, email, full_name, role, status)
VALUES (
  'USER_UUID_HERE',
  'newadmin@example.com',
  'Full Name',
  'admin',
  'active'
);`
    
    navigator.clipboard.writeText(sql)
    toast.success('SQL copied to clipboard!')
  }

  const getRoleBadge = (role) => {
    const colors = {
      'super_admin': 'text-purple-600 bg-purple-50',
      'admin': 'text-blue-600 bg-blue-50',
      'finance_admin': 'text-green-600 bg-green-50',
      'support_admin': 'text-orange-600 bg-orange-50'
    }
    const labels = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'finance_admin': 'Finance Admin',
      'support_admin': 'Support Admin'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[role] || 'text-gray-500 bg-gray-100'}`}>
        {labels[role] || role}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
    }
    return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactive</span>
  }

  if (loading && admins.length === 0) {
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
          <h1 className="text-2xl font-bold text-[#111111]">Admin Users</h1>
          <p className="text-sm text-[#555555]">Manage administrators with access to the dashboard</p>
        </div>
        <button
          onClick={() => {
            setEditingAdmin(null)
            setFormData({ email: '', full_name: '', role: 'admin', password: '' })
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
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
                placeholder="Search by name or email..."
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
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Last Login</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#555555] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#555555]">
                    {activeSearch ? 'No admin users found matching your search' : 'No admin users found'}
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[#F6F6F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-[#555555]" />
                        </div>
                        <span className="font-medium text-[#111111]">{admin.full_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[#555555]">
                        <Mail className="w-3 h-3" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(admin.role)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(admin.status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555555]">
                      {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="p-1.5 text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.status)}
                          className={`p-1.5 rounded transition-colors ${
                            admin.status === 'active'
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-500 hover:bg-green-50'
                          }`}
                          title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {admin.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-1.5 text-[#555555] hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Edit Modal */}
      {showModal && editingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Edit Admin User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="support_admin">Support Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAdmin(null)
                    setFormData({ email: '', full_name: '', role: 'admin', password: '' })
                  }}
                  className="px-4 py-2 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded hover:bg-[#F6F6F6] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin - Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#111111]">Add Admin User</h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-[#555555] hover:text-[#111111] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  Admin users must be created manually in Supabase Dashboard first, then added to the admin_users table.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-[#111111]">Step 1: Create User in Supabase</h3>
                <ol className="list-decimal list-inside text-sm text-[#555555] space-y-2 ml-4">
                  <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Select your project → Authentication → Users</li>
                  <li>Click <strong>"Add User"</strong></li>
                  <li>Enter the admin's email and password</li>
                  <li>Check <strong>"Auto confirm user"</strong></li>
                  <li>Click <strong>"Create User"</strong></li>
                  <li>Copy the User UUID from the created user</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-[#111111]">Step 2: Add to Admin Users Table</h3>
                <p className="text-sm text-[#555555]">Run this SQL in the SQL Editor:</p>
                <div className="bg-[#F6F6F6] border border-[#E5E5E5] rounded p-4 relative">
                  <pre className="text-xs font-mono text-[#111111] whitespace-pre-wrap">
{`-- Replace with the actual UUID from auth.users
INSERT INTO admin_users (id, email, full_name, role, status)
VALUES (
  'USER_UUID_HERE',
  'newadmin@example.com',
  'Full Name',
  'admin',
  'active'
);`}
                  </pre>
                  <button
                    onClick={copySQL}
                    className="absolute top-2 right-2 p-1.5 text-[#555555] hover:text-[#111111] hover:bg-white rounded transition-colors"
                    title="Copy SQL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex gap-3">
                <button
                  onClick={() => {
                    setShowInstructions(false)
                    window.open('https://app.supabase.com', '_blank')
                  }}
                  className="flex-1 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Supabase
                </button>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="px-4 py-2 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded hover:bg-[#F6F6F6] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin - Modal that just shows the "Add" button redirecting to instructions */}
      {showModal && !editingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Add Admin User</h2>
            <p className="text-sm text-[#555555] mb-6">
              Admin users are created in Supabase Dashboard first, then added to the admin_users table.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setShowInstructions(true)
                }}
                className="flex-1 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Instructions
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({ email: '', full_name: '', role: 'admin', password: '' })
                }}
                className="px-4 py-2 border border-[#E5E5E5] text-[#555555] text-sm font-medium rounded hover:bg-[#F6F6F6] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers