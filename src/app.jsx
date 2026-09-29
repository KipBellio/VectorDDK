import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

// Public Layout
import Layout from './components/common/Layout'
import Home from './components/public/Home'
import HowItWorks from './components/public/HowItWorks'
import ForDealers from './components/public/ForDealers'
import Pricing from './components/public/Pricing'
import Register from './components/public/Register'
import Login from './components/public/Login'
import VerifyReport from './components/public/verifyReport'
import Contact from './components/public/Contact'
import ForgotPassword from './components/public/ForgotPassword'
import ResetPassword from './components/public/ResetPassword'

// Admin Components
import AdminLogin from './components/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import DealersList from './components/admin/Dealers/DealersList'
import ReportsList from './components/admin/Reports/ReportsList'
import PaymentsList from './components/admin/Finance/PaymentsList'
import DealerDetails from './components/admin/Dealers/DealerDetails'
import DealerActivity from './components/admin/Dealers/DealerActivity'
import ReportDetails from './components/admin/Reports/ReportDetails'
import Verification from './components/admin/Reports/Verification'
import TokenTransactions from './components/admin/Finance/TokenTransactions'
import TokenPackages from './components/admin/Finance/TokenPackages'
import DDKDownloads from './components/admin/Software/DDKDownloads'
import DDKVersions from './components/admin/Software/DDKVersions'
import AuditLog from './components/admin/System/AuditLog'
import AdminUsers from './components/admin/System/AdminUsers'
import Settings from './components/admin/System/Settings'

// Dealer Components
import DealerRoute from './components/dealer/DealerRoute'
import DealerLayout from './components/dealer/DealerLayout'
import DealerDashboard from './components/dealer/DealerDashboard'
import DealerReports from './components/dealer/DealerReports'
import DealerReportDetails from './components/dealer/DealerReportDetails'
import BuyTokens from './components/dealer/BuyTokens'
import DealerTransactions from './components/dealer/DealerTransactions'
import DealerDownload from './components/dealer/DealerDownload'
import DealerSettings from './components/dealer/DealerSettings'

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('id, email, role, status')
          .eq('email', session.user.email)
          .single()

        if (error || !adminData) {
          await supabase.auth.signOut()
          setIsAdmin(false)
          setLoading(false)
          return
        }

        if (adminData.status !== 'active') {
          await supabase.auth.signOut()
          setIsAdmin(false)
          setLoading(false)
          return
        }

        setIsAdmin(true)
        setLoading(false)

      } catch (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="for-dealers" element={<ForDealers />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="verify/:reportId" element={<VerifyReport />} />
          <Route path="verify" element={<VerifyReport />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="dealers" element={<DealersList />} />
          <Route path="reports" element={<ReportsList />} />
          <Route path="payments" element={<PaymentsList />} />
          <Route path="dealers/:id" element={<DealerDetails />} /> 
          <Route path="dealers/activity" element={<DealerActivity />} />
          <Route path="reports/:id" element={<ReportDetails />} /> 
          <Route path="reports/verification" element={<Verification />} />
          <Route path="token-transactions" element={<TokenTransactions />} /> 
          <Route path="token-packages" element={<TokenPackages />} /> 
          <Route path="ddk-downloads" element={<DDKDownloads />} /> 
          <Route path="ddk-versions" element={<DDKVersions />} /> 
          <Route path="audit-log" element={<AuditLog />} /> 
          <Route path="admin-users" element={<AdminUsers />} /> 
          <Route path="settings" element={<Settings />} /> 
        </Route>

        <Route 
          path="/dealer" 
          element={
            <DealerRoute>
              <DealerLayout />
            </DealerRoute>
          }
        >
          <Route index element={<Navigate to="/dealer/dashboard" replace />} />
          <Route path="dashboard" element={<DealerDashboard />} />
          <Route path="reports" element={<DealerReports />} /> 
          <Route path="reports/:id" element={<DealerReportDetails />} /> 
          <Route path="buy-tokens" element={<BuyTokens />} /> 
          <Route path="transactions" element={<DealerTransactions />} /> 
          <Route path="download" element={<DealerDownload />} /> 
          <Route path="settings" element={<DealerSettings />} /> 
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App