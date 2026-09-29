import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  Calendar,
  Download,
  FileText,
  Hash,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  File,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'

const DDKVersions = () => {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingVersion, setEditingVersion] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [downloadStats, setDownloadStats] = useState({})
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    version: '',
    release_date: '',
    download_url: '',
    release_notes: '',
    status: 'active',
    minimum_supported_version: '',
    file_size: ''
  })
  const pageSize = 20
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchVersions()
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

  const fetchVersions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('software_versions')
        .select('*', { count: 'exact' })

      if (activeSearch) {
        query = query.or(`version.ilike.%${activeSearch}%,status.ilike.%${activeSearch}%`)
      }

      const { data, error, count } = await query
        .order('release_date', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Query error:', error)
        setVersions([])
        setTotalPages(0)
        setLoading(false)
        return
      }

      // Fetch download counts for each version
      if (data && data.length > 0) {
        const versionIds = data.map(v => v.id)
        
        const { data: downloadData, error: downloadError } = await supabase
          .from('ddk_downloads')
          .select('version_id, dealer_id')
          .in('version_id', versionIds)

        if (downloadError) {
          console.error('Download stats error:', downloadError)
        }

        const stats = {}
        if (downloadData) {
          downloadData.forEach(d => {
            if (!stats[d.version_id]) {
              stats[d.version_id] = { total: 0, uniqueDealers: new Set() }
            }
            stats[d.version_id].total++
            if (d.dealer_id) {
              stats[d.version_id].uniqueDealers.add(d.dealer_id)
            }
          })
        }
        // Convert Sets to counts for display
        Object.keys(stats).forEach(key => {
          stats[key].uniqueDealers = stats[key].uniqueDealers.size
        })
        setDownloadStats(stats)
      }

      setVersions(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching versions:', error)
      setVersions([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setFormData({
        ...formData,
        file_size: (file.size / (1024 * 1024)).toFixed(1)
      })
      setUploadedFileUrl('')
    }
  }

  const uploadFile = async (file, version) => {
    setUploading(true)
    setUploadProgress(0)
    
    try {
      const cleanVersion = version.replace(/[^a-zA-Z0-9.]/g, '')
      const fileExt = file.name.split('.').pop()
      const fileName = `DDKv${cleanVersion}.${fileExt}`
      const filePath = `versions/${fileName}`

      console.log('Uploading file:', { fileName, filePath, size: file.size })

      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from('ddk-software')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', data)

      const { data: urlData } = supabase.storage
        .from('ddk-software')
        .getPublicUrl(filePath)

      setUploadProgress(100)
      setUploadedFileUrl(urlData.publicUrl)
      
      return urlData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.version || formData.version.trim() === '') {
      toast.error('Version number is required')
      return
    }

    setLoading(true)

    try {
      let downloadUrl = formData.download_url || null

      if (selectedFile) {
        try {
          const uploadedUrl = await uploadFile(selectedFile, formData.version)
          downloadUrl = uploadedUrl
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error('Failed to upload file: ' + (uploadError.message || 'Unknown error'))
          setLoading(false)
          return
        }
      }

      const versionData = {
        version: formData.version.trim(),
        release_date: formData.release_date || null,
        download_url: downloadUrl,
        release_notes: formData.release_notes || null,
        status: formData.status || 'active',
        minimum_supported_version: formData.minimum_supported_version || null,
        file_size: formData.file_size ? Math.round(parseFloat(formData.file_size) * 1024 * 1024) : null
      }

      console.log('Saving version data:', versionData)

      if (editingVersion) {
        const { error } = await supabase
          .from('software_versions')
          .update(versionData)
          .eq('id', editingVersion.id)

        if (error) throw error
        toast.success('Version updated successfully!')
      } else {
        const { error } = await supabase
          .from('software_versions')
          .insert([versionData])

        if (error) throw error
        toast.success('Version created successfully!')
      }

      setShowModal(false)
      setEditingVersion(null)
      setSelectedFile(null)
      setUploadedFileUrl('')
      setFormData({
        version: '',
        release_date: '',
        download_url: '',
        release_notes: '',
        status: 'active',
        minimum_supported_version: '',
        file_size: ''
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchVersions()
    } catch (error) {
      console.error('Error saving version:', error)
      
      let errorMessage = 'Failed to save version'
      if (error.message) {
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMessage = 'Permission denied. You may not have admin privileges.'
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'A version with this number already exists.'
        } else if (error.message.includes('violates not-null constraint')) {
          errorMessage = 'Please fill in all required fields.'
        } else if (error.message.includes('invalid input syntax for type integer')) {
          errorMessage = 'Invalid file size format. Please enter a number.'
        } else {
          errorMessage = error.message
        }
      }
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (version) => {
    setEditingVersion(version)
    setFormData({
      version: version.version,
      release_date: version.release_date || '',
      download_url: version.download_url || '',
      release_notes: version.release_notes || '',
      status: version.status,
      minimum_supported_version: version.minimum_supported_version || '',
      file_size: version.file_size ? (version.file_size / (1024 * 1024)).toFixed(1) : ''
    })
    setSelectedFile(null)
    setUploadedFileUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setShowModal(true)
  }

  // FIXED: Updated handleDelete function
  const handleDelete = async (id) => {
    // First, check if there are download records
    try {
      const { count, error: countError } = await supabase
        .from('ddk_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('version_id', id)

      if (countError) throw countError

      let confirmMessage = 'Are you sure you want to delete this version?'
      if (count > 0) {
        confirmMessage = `This version has ${count} download record(s). Deleting it will also remove all associated download records. Continue?`
      }

      if (!confirm(confirmMessage)) return

      // Start a transaction to delete both
      // First, delete all download records for this version
      const { error: downloadError } = await supabase
        .from('ddk_downloads')
        .delete()
        .eq('version_id', id)

      if (downloadError) throw downloadError

      // Then delete the version itself
      const { error: versionError } = await supabase
        .from('software_versions')
        .delete()
        .eq('id', id)

      if (versionError) throw versionError

      toast.success('Version and associated download records deleted successfully!')
      fetchVersions()
    } catch (error) {
      console.error('Error deleting version:', error)
      
      // Handle specific error cases
      if (error.message?.includes('foreign key')) {
        toast.error('Cannot delete: This version is referenced by other records. Try deleting download records first.')
      } else {
        toast.error('Failed to delete version: ' + (error.message || 'Unknown error'))
      }
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('software_versions')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      toast.success(`Version ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchVersions()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update version status')
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'text-green-600 bg-green-50',
      'inactive': 'text-gray-500 bg-gray-100',
      'archived': 'text-orange-600 bg-orange-50'
    }
    const labels = {
      'active': 'Active',
      'inactive': 'Inactive',
      'archived': 'Archived'
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[status] || 'text-gray-500 bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading && versions.length === 0) {
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
          <h1 className="text-2xl font-bold text-[#111111]">DDK Versions</h1>
          <p className="text-sm text-[#555555]">Manage software versions for DDK application</p>
        </div>
        <button
          onClick={() => {
            setEditingVersion(null)
            setFormData({
              version: '',
              release_date: '',
              download_url: '',
              release_notes: '',
              status: 'active',
              minimum_supported_version: '',
              file_size: ''
            })
            setSelectedFile(null)
            setUploadedFileUrl('')
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Version
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Search by version or status..."
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

        <div className="grid md:grid-cols-2 gap-4 p-4">
          {versions.length === 0 ? (
            <div className="col-span-2 bg-white border border-[#E5E5E5] rounded p-8 text-center">
              <Package className="w-12 h-12 text-[#555555] mx-auto mb-3" />
              <p className="text-[#555555]">{activeSearch ? 'No versions found matching your search' : 'No software versions found'}</p>
              <p className="text-sm text-[#555555]">Click "Add Version" to create your first version</p>
            </div>
          ) : (
            versions.map((version) => {
              const stats = downloadStats[version.id] || { total: 0, uniqueDealers: 0 }
              return (
                <div key={version.id} className="bg-white border border-[#E5E5E5] rounded p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[#111111]">v{version.version}</h3>
                        {getStatusBadge(version.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#555555]">
                        <Calendar className="w-3 h-3" />
                        {version.release_date ? new Date(version.release_date).toLocaleDateString() : 'No release date'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(version)}
                        className="p-1.5 text-[#555555] hover:bg-[#F6F6F6] rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="p-1.5 text-[#555555] hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4 text-[#555555]" />
                      <span className="text-[#555555]">Download:</span>
                      <span className="font-mono text-xs text-[#111111] truncate max-w-[200px]">
                        {version.download_url ? (
                          <a href={version.download_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Available
                          </a>
                        ) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-[#555555]" />
                      <span className="text-[#555555]">Min Supported:</span>
                      <span className="text-[#111111]">{version.minimum_supported_version || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-[#555555]" />
                      <span className="text-[#555555]">File Size:</span>
                      <span className="text-[#111111]">{formatFileSize(version.file_size)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-[#555555]" />
                        <span className="text-[#555555]">Downloads:</span>
                        <span className="text-[#111111] font-medium">{stats.total || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#555555]">Dealers:</span>
                        <span className="text-[#111111] font-medium">{stats.uniqueDealers || 0}</span>
                      </div>
                    </div>
                    {version.release_notes && (
                      <div className="mt-2 p-3 bg-[#F6F6F6] rounded text-sm text-[#555555] max-h-20 overflow-y-auto">
                        <p className="text-xs font-medium text-[#555555] uppercase tracking-wider mb-1">Release Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{version.release_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(version.id, version.status)}
                      className={`flex-1 text-sm font-medium py-1.5 rounded transition-colors ${
                        version.status === 'active'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {version.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#111111] mb-4">
              {editingVersion ? 'Edit Version' : 'Add Version'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Version Number *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="e.g., 1.0.0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Upload File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".exe,.dmg,.zip,.msi,.pkg"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex-1 px-4 py-2 border border-dashed border-[#E5E5E5] rounded text-sm text-[#555555] hover:border-[#111111] cursor-pointer transition-colors text-center"
                  >
                    {selectedFile ? (
                      <span className="flex items-center justify-center gap-2">
                        <File className="w-4 h-4" />
                        {selectedFile.name}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        Click to select file
                      </span>
                    )}
                  </label>
                </div>
                <p className="text-xs text-[#555555] mt-1">Supported: .exe, .dmg, .zip, .msi, .pkg</p>
                {selectedFile && (
                  <div className="mt-2 text-xs text-[#555555]">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}
                {uploadedFileUrl && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    File uploaded successfully
                  </div>
                )}
                {uploading && (
                  <div className="mt-2">
                    <div className="w-full bg-[#F6F6F6] rounded-full h-2">
                      <div 
                        className="bg-[#111111] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#555555] mt-1">Uploading: {uploadProgress}%</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Or Enter Download URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#555555]" />
                  <input
                    type="url"
                    value={formData.download_url}
                    onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                    placeholder="https://example.com/downloads/DDKv1.0.exe"
                  />
                </div>
                <p className="text-xs text-[#555555] mt-1">Upload a file OR enter a direct download URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Minimum Supported Version
                </label>
                <input
                  type="text"
                  value={formData.minimum_supported_version}
                  onChange={(e) => setFormData({ ...formData, minimum_supported_version: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  placeholder="e.g., 1.0.0"
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
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Release Notes
                </label>
                <textarea
                  value={formData.release_notes}
                  onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded text-sm focus:outline-none focus:border-[#111111] transition-colors"
                  rows={3}
                  placeholder="What's new in this version..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                >
                  {uploading ? `Uploading ${uploadProgress}%...` : loading ? 'Saving...' : editingVersion ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingVersion(null)
                    setSelectedFile(null)
                    setUploadedFileUrl('')
                    setFormData({
                      version: '',
                      release_date: '',
                      download_url: '',
                      release_notes: '',
                      status: 'active',
                      minimum_supported_version: '',
                      file_size: ''
                    })
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
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

export default DDKVersions