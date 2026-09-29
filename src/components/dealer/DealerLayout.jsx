import { Outlet } from 'react-router-dom'
import DealerSidebar from './DealerSidebar'

const DealerLayout = () => {
  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <DealerSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DealerLayout