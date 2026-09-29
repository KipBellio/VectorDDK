import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Download, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Package,
  Activity,
  UserCog
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const AdminSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState({})

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: Users,
      label: 'Dealers',
      path: '/admin/dealers',
      subItems: [
        { label: 'All Dealers', path: '/admin/dealers' },
        { label: 'Dealer Activity', path: '/admin/dealers/activity' },
      ]
    },
    {
      icon: FileText,
      label: 'Reports',
      path: '/admin/reports',
      subItems: [
        { label: 'All Reports', path: '/admin/reports' },
        { label: 'Verification', path: '/admin/reports/verification' },
      ]
    },
    {
      icon: DollarSign,
      label: 'Finance',
      path: '/admin/finance',
      subItems: [
        { label: 'Payments', path: '/admin/payments' },
        { label: 'Token Transactions', path: '/admin/token-transactions' },
        { label: 'Token Packages', path: '/admin/token-packages' },
      ]
    },
    {
      icon: Download,
      label: 'Software',
      path: '/admin/software',
      subItems: [
        { label: 'DDK Downloads', path: '/admin/ddk-downloads' },
        { label: 'DDK Versions', path: '/admin/ddk-versions' },
      ]
    },
    {
      icon: Activity,
      label: 'System',
      path: '/admin/system',
      subItems: [
        { label: 'Audit Log', path: '/admin/audit-log' },
        { label: 'Admin Users', path: '/admin/admin-users' },
        { label: 'Settings', path: '/admin/settings' },
      ]
    },
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out')
      navigate('/admin/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const isActive = (path) => location.pathname === path
  const isSubActive = (subItems) => {
    if (!subItems) return false
    return subItems.some(item => location.pathname === item.path)
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-[#E5E5E5] rounded"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#E5E5E5] z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#111111] rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div>
                <span className="text-lg font-bold text-[#111111]">Vector<span className="text-[#555555]">DDK</span></span>
                <span className="block text-[10px] text-[#555555] font-medium uppercase tracking-wider">Administration</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = expanded[item.label]
              const isActiveItem = isActive(item.path) || isSubActive(item.subItems)

              return (
                <div key={item.label}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleSection(item.label)}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded transition-colors ${
                          isActiveItem
                            ? 'bg-[#F6F6F6] text-[#111111] font-medium'
                            : 'text-[#555555] hover:bg-[#F6F6F6] hover:text-[#111111]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((sub) => (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setIsOpen(false)}
                              className={`block px-3 py-1.5 text-sm rounded transition-colors ${
                                isActive(sub.path)
                                  ? 'bg-[#F6F6F6] text-[#111111] font-medium'
                                  : 'text-[#555555] hover:bg-[#F6F6F6] hover:text-[#111111]'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${
                        isActive(item.path)
                          ? 'bg-[#F6F6F6] text-[#111111] font-medium'
                          : 'text-[#555555] hover:bg-[#F6F6F6] hover:text-[#111111]'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#E5E5E5]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#F6F6F6] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-[#111111]">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">Admin</p>
                <p className="text-xs text-[#555555] truncate">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#555555] hover:text-[#111111] hover:bg-[#F6F6F6] rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default AdminSidebar