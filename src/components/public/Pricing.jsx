import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Check, ArrowRight } from 'lucide-react'

const Pricing = () => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

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

      if (error) {
        console.error('Error fetching packages:', error)
        setPackages([])
      } else {
        setPackages(data || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section className="bg-gray-50 border-b border-gray-200 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Simple pricing.</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Pay for verification, not testing.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Testing - Free */}
          <div className="border border-gray-200 rounded-lg p-8 text-center hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900">Device Testing</h2>
            <p className="text-4xl font-bold text-gray-900 mt-3">FREE</p>
            <p className="text-sm text-gray-500 mt-1">Unlimited testing</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-900" />
                Laptop diagnostics
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-900" />
                Smartphone diagnostics
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-900" />
                Repeat testing
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-900" />
                No token consumption
              </li>
            </ul>
          </div>

          {/* Verification - Token Based */}
          <div className="border border-gray-900 rounded-lg p-8 text-center bg-gray-900 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-white">Verified Reports</h2>
            <p className="text-4xl font-bold text-white mt-3">TOKEN BASED</p>
            <p className="text-sm text-white/60 mt-1">One token per report</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white" />
                Customer-verifiable reports
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white" />
                QR code generation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white" />
                Professional format
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white" />
                Instant verification
              </li>
            </ul>
          </div>
        </div>

        {/* Token Packages */}
        {loading ? (
          <div className="text-center py-8 mt-8">
            <div className="inline-block w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-2">Loading packages...</p>
          </div>
        ) : packages.length > 0 ? (
          <div className="mt-12 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Token Packages</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-gray-900 text-lg">{pkg.name}</h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{pkg.token_count}</p>
                  <p className="text-sm text-gray-500">tokens</p>
                  <p className="text-xl font-bold text-gray-900 mt-3">{pkg.currency || 'KES'} {pkg.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">KSh {(pkg.price / pkg.token_count).toFixed(2)} per token</p>
                  <Link
                    to="/register"
                    className="inline-block mt-4 px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center text-sm text-gray-500">
            No token packages available at the moment.
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Dealers can purchase tokens from their dashboard after creating an account.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors mt-4"
          >
            Create your account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Pricing