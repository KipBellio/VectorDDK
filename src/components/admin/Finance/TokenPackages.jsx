import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Package,
  DollarSign,
  Tag,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

const TokenPackages = () => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    token_count: '',
    price: '',
    currency: 'KES',
    status: 'active'
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .order('token_count', { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to load token packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const packageData = {
        name: formData.name,
        token_count: parseInt(formData.token_count),
        price: parseInt(formData.price),
        currency: formData.currency || 'KES',
        status: formData.status
      }

      if (editingPackage) {
        // Update existing package
        const { error } = await supabase
          .from('token_packages')
          .update(packageData)
          .eq('id', editingPackage.id)

        if (error) throw error
        toast.success('Package updated successfully!')
      } else {
        // Create new package
        const { error } = await supabase
          .from('token_packages')
          .insert([packageData])

        if (error) throw error
        toast.success('Package created successfully!')
      }

      setShowModal(false)
      setEditingPackage(null)
      setFormData({ name: '', token_count: '', price: '', currency: 'KES', status: 'active' })
      fetchPackages()
    } catch (error) {
      console.error('Error saving package:', error)
      toast.error('Failed to save package')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (pkg) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      token_count: pkg.token_count.toString(),
      price: pkg.price.toString(),
      currency: pkg.currency || 'KES',
      status: pkg.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const { error } = await supabase
        .from('token_packages')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Package deleted successfully!')
      fetchPackages()
    } catch (error) {
      console.error('Error deleting package:', error)
      toast.error('Failed to delete package')
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('token_packages')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      toast.success(`Package ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchPackages()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update package status')
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
    }
    return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactive</span>
  }

  if (loading && packages.length === 0) {
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
          <h1 className="text-2xl font-bold text-[#111111]">Token Packages</h1>
          <p className="text-sm text-[#555555]">Manage token packages for dealers to purchase</p>
        </div>
        <button
          onClick={() => {
            setEditingPackage(null)
            setFormData({ name: '', token_count: '', price: '', currency: 'KES', status: 'active' })
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-3 bg-white border border-[#E5E5E5] rounded p-8 text-center">
            <Package className="w-12 h-12 text-[#555555] mx-auto mb-3" />
            <p className="text-[#555555]">No token packages found</p>
            <p className="text-sm text-[#555555]">Click "Add Package" to create your first package</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="bg-white border border-[#E5E5E5] rounded p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#111111]">{pkg.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(pkg.status)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="p-1.5 text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="p-1.5 text-[#555555] hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-[#555555]" />
                  <span className="text-[#555555]">Tokens:</span>
                  <span className="font-semibold text-[#111111]">{pkg.token_count}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-[#555555]" />
                  <span className="text-[#555555]">Price:</span>
                  <span className="font-semibold text-[#111111]">{pkg.currency || 'KES'} {pkg.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-[#555555]" />
                  <span className="text-[#555555]">Per token:</span>
                  <span className="font-semibold text-[#111111]">{(pkg.price / pkg.token_count).toFixed(2)} {pkg.currency || 'KES'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-[#555555]" />
                  <span className="text-[#555555]">Created:</span>
                  <span className="text-[#111111] text-sm">
                    {pkg.created_at ? new Date(pkg.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                <button
                  onClick={() => handleToggleStatus(pkg.id, pkg.status)}
                  className={`w-full text-sm font-medium py-1.5 rounded transition-colors ${
                    pkg.status === 'active'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-[#111111] mb-4">
              {editingPackage ? 'Edit Package' : 'Add Package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="e.g., Starter, Professional"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Token Count
                </label>
                <input
                  type="number"
                  value={formData.token_count}
                  onChange={(e) => setFormData({ ...formData, token_count: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="100"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Price (KES)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
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
                  {loading ? 'Saving...' : editingPackage ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPackage(null)
                    setFormData({ name: '', token_count: '', price: '', currency: 'KES', status: 'active' })
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
    </div>
  )
}

export default TokenPackages