import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout