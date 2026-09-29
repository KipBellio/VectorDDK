import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

const Footer = () => {
  const [contactInfo, setContactInfo] = useState({
    address: 'Nairobi, Kenya',
    phone: '+254 700 000 000',
    email: 'support@vectorddk.com',
    working_hours: 'Mon-Fri: 8AM - 6PM'
  })

  useEffect(() => {
    fetchContactInfo()
  }, [])

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'contact_info')
        .single()

      if (!error && data) {
        setContactInfo(data.value)
      }
    } catch (error) {
      console.error('Error fetching contact info:', error)
      // Use default values if fetch fails
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-white">Vector<span className="text-gray-400">DDK</span></span>
            </div>
            <p className="text-sm text-gray-400 mt-3 max-w-xs">
              Professional device diagnostics and verification for device dealers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-medium mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/verify" className="hover:text-white transition-colors">Verify Report</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Download DDKv1.0</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-medium mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-3">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>{contactInfo.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>{contactInfo.working_hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <span>© {new Date().getFullYear()} VectorDDK. All rights reserved.</span>
          <div className="flex gap-6 mt-2 md:mt-0">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer