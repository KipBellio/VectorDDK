import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Star,
  Search,
  QrCode
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { verifyReport } from './verifyReport'

const ddkScreenshot = '/ddk-screenshot.png'

const Home = () => {
  const [packages, setPackages] = useState([])
  const [reportId, setReportId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [loadingPackages, setLoadingPackages] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    setLoadingPackages(true)
    try {
      console.log('Fetching token packages...')
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .order('token_count', { ascending: true })

      if (error) {
        console.error('Error fetching packages:', error)
        setPackages([])
      } else {
        console.log('Packages found:', data?.length || 0, data)
        setPackages(data || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      setPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }

  const handleVerifyReport = async (e) => {
    e.preventDefault()
    if (!reportId.trim()) {
      setVerificationResult({ error: 'Please enter a Report ID' })
      return
    }

    setVerifying(true)
    setVerificationResult(null)

    try {
      // Use the verifyReport utility - it already increments the count and logs the scan
      const result = await verifyReport(reportId.trim())
      
      // Check if the utility returned an error
      if (!result.success) {
        setVerificationResult({
          error: result.error || 'Report not found. Please check the ID and try again.'
        })
        setVerifying(false)
        return
      }

      // Validate report status
      if (result.report.qr_status !== 'active') {
        setVerificationResult({ 
          error: 'This report is no longer active for verification.' 
        })
        setVerifying(false)
        return
      }

      // The report already has the updated verification_count from the utility
      setVerificationResult({
        success: true,
        report: result.report
      })

    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({ 
        error: 'Could not verify report. Please try again.' 
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="pt-14">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-200/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm border border-gray-200 mb-6">
                <Zap className="w-4 h-4" />
                Professional Device Diagnostics
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Professional Device Diagnostics
                <br />
                <span className="text-gray-600">
                  for Smarter Device Sales
                </span>
              </h1>
              <p className="text-lg text-gray-600 mt-4 max-w-lg">
                Test laptops and smartphones with confidence. Generate verifiable diagnostic reports your customers can scan and review instantly.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white font-semibold rounded-lg transition-colors shadow-lg shadow-gray-900/10"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 hover:border-gray-600 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4 text-gray-500 fill-gray-500" />
                  <span>Trusted by dealers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>100% verifiable</span>
                </div>
              </div>
            </div>
            
            {/* Hero Visual - Report Mockup */}
            <div className="border border-[#E5E5E5] rounded bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#111111] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-[8px]">V</span>
                  </div>
                  <span className="text-xs font-medium text-[#111111]">VECTOR DDK</span>
                </div>
                <span className="text-[10px] text-[#555555]">Diagnostic Report</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Device</span>
                  <p className="font-medium text-[#111111]">Dell Latitude 7420</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Serial</span>
                  <p className="font-medium text-[#111111]">ABC123XYZ</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">CPU</span>
                  <p className="font-medium text-[#111111]">Intel Core i7</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Memory</span>
                  <p className="font-medium text-[#111111]">16 GB RAM</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Storage</span>
                  <p className="font-medium text-[#111111]">512 GB SSD</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Battery</span>
                  <p className="font-medium text-green-600">92%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#E5E5E5]">
                <div className="text-center">
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Display</span>
                  <p className="font-medium text-green-600 text-sm">PASS</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Storage</span>
                  <p className="font-medium text-green-600 text-sm">PASS</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">Overall</span>
                  <p className="font-medium text-green-600 text-sm">PASS</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 border-2 border-[#111111] rounded flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-0.5">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${[0, 2, 4, 6, 8].includes(i) ? 'bg-[#111111]' : 'bg-white'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#555555]">Scan to verify</span>
                </div>
                <span className="text-[10px] text-[#555555]">Report ID: VDDK-2024-001</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              Unlimited testing
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              Customer-verifiable
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              Professional diagnostics
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              Secure cloud platform
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Buying/selling used devices <br />
            <span className="text-gray-600">
              shouldn't be a guessing game.
            </span>
          </h2>
          <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
            VectorDDK gives you and your customers complete confidence with professional, verifiable diagnostic reports.
          </p>
        </div>
      </section>

      {/* DDKv1.0 Section - Real Screenshot */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">DDKv1.0</h2>
            <p className="text-gray-600 mt-2">The desktop diagnostic application behind VectorDDK.</p>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="bg-[#111111] text-white px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-medium">DDKv1.0 — Device Diagnostic Kit</span>
              <span className="text-[10px] text-gray-400">Running on Windows</span>
            </div>
            <img 
              src={ddkScreenshot} 
              alt="DDKv1.0 Diagnostic Kit" 
              className="w-full"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect fill="%23f3f4f6" width="800" height="400"/%3E%3Ctext x="400" y="200" font-family="Arial" font-size="24" fill="%236b7280" text-anchor="middle"%3EDDKv1.0 Screenshot%3C/text%3E%3Ctext x="400" y="230" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle"%3EPlace screenshot at public/ddk-screenshot.png%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center mt-4">
            Run diagnostics directly from your Windows computer.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
            <p className="text-gray-600 mt-2 text-lg">Six simple steps to verified device reports</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <span className="text-xs font-mono text-gray-500">01</span>
              <h3 className="font-semibold text-gray-900 mt-1">Create your VectorDDK account</h3>
              <p className="text-sm text-gray-500">Sign up on the VectorDDK website</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-mono text-gray-500">02</span>
              <h3 className="font-semibold text-gray-900 mt-1">Download DDKv1.0</h3>
              <p className="text-sm text-gray-500">Install the Windows application</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-mono text-gray-500">03</span>
              <h3 className="font-semibold text-gray-900 mt-1">Sign in to DDKv1.0</h3>
              <p className="text-sm text-gray-500">Authenticate with your account</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-mono text-gray-500">04</span>
              <h3 className="font-semibold text-gray-900 mt-1">Test the laptop or smartphone</h3>
              <p className="text-sm text-gray-500">Run comprehensive diagnostics</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-mono text-gray-500">05</span>
              <h3 className="font-semibold text-gray-900 mt-1">Review the diagnostic results</h3>
              <p className="text-sm text-gray-500">Review with your customer</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-mono text-gray-500">06</span>
              <h3 className="font-semibold text-gray-900 mt-1">Generate a customer-verifiable report</h3>
              <p className="text-sm text-gray-500">When the customer is ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Unlimited Testing Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Test without limits.</h2>
            <p className="text-gray-600 mt-3 max-w-lg mx-auto">
              Dealers can test devices as many times as necessary. Testing itself does not consume tokens.
            </p>
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mt-8">
              <div className="border border-gray-200 rounded p-6">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testing</span>
                <p className="text-2xl font-bold text-gray-900">FREE</p>
                <p className="text-sm text-gray-500">UNLIMITED</p>
              </div>
              <div className="border border-gray-900 rounded p-6 bg-gray-900">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Customer Report</span>
                <p className="text-2xl font-bold text-white">1 TOKEN</p>
                <p className="text-sm text-white/60">PER REPORT</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6 max-w-md mx-auto">
              A token is consumed when a dealer generates a customer-verifiable report.
            </p>
          </div>
        </div>
      </section>

      {/* Verify Report Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Verify a Report</h2>
          <p className="text-gray-600 mt-2">
            Have a VectorDDK report? Verify its authenticity instantly.
          </p>
          <div className="mt-6 border border-gray-200 rounded p-6 bg-white">
            <form onSubmit={handleVerifyReport} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={reportId}
                onChange={(e) => {
                  setReportId(e.target.value)
                  setVerificationResult(null)
                }}
                placeholder="Enter Report ID (e.g., VDDK-XXXXXXXX)"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={verifying}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {verifying ? 'Verifying...' : 'Verify Report'}
              </button>
            </form>

            {verificationResult && (
              <div className="mt-4 p-4 rounded border text-left">
                {verificationResult.error ? (
                  <div className="text-red-600 text-sm">
                    <p className="font-medium">❌ {verificationResult.error}</p>
                  </div>
                ) : (
                  <div className="text-green-600">
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Report Verified!
                    </p>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                      <p><span className="text-gray-500">Device:</span> {verificationResult.report.device_manufacturer || 'N/A'} {verificationResult.report.device_model || ''}</p>
                      <p><span className="text-gray-500">Result:</span> <span className="font-medium">{verificationResult.report.overall_result || 'PENDING'}</span></p>
                      <p><span className="text-gray-500">Report ID:</span> <span className="font-mono">{verificationResult.report.report_id}</span></p>
                      <p><span className="text-gray-500">Generated:</span> {new Date(verificationResult.report.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500 mt-2">This report was generated by VectorDDK.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>OR</span>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gray-700" />
                <span className="text-sm">Scan the QR code on your report</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            No account required. Customers can verify reports without logging in.
          </p>
        </div>
      </section>

      {/* For Dealers Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">Built for device dealers.</h2>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="border border-gray-200 rounded p-5 text-center hover:border-gray-400 transition-colors">
                <span className="text-2xl font-bold text-gray-900">01</span>
                <h3 className="font-semibold text-gray-900 mt-2">Test devices quickly</h3>
                <p className="text-sm text-gray-500">Comprehensive diagnostics in minutes</p>
              </div>
              <div className="border border-gray-200 rounded p-5 text-center hover:border-gray-400 transition-colors">
                <span className="text-2xl font-bold text-gray-900">02</span>
                <h3 className="font-semibold text-gray-900 mt-2">Repeat diagnostics freely</h3>
                <p className="text-sm text-gray-500">No limits, no token consumption</p>
              </div>
              <div className="border border-gray-200 rounded p-5 text-center hover:border-gray-400 transition-colors">
                <span className="text-2xl font-bold text-gray-900">03</span>
                <h3 className="font-semibold text-gray-900 mt-2">Generate reports when ready</h3>
                <p className="text-sm text-gray-500">Only when the customer is present</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section with Packages */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple pricing.</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
              <div className="border border-gray-200 rounded p-6">
                <h3 className="font-semibold text-gray-900 text-lg">Device Testing</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">FREE</p>
                <p className="text-sm text-gray-500 mt-1">Unlimited testing</p>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>✓ Laptop diagnostics</li>
                  <li>✓ Smartphone diagnostics</li>
                  <li>✓ Repeat testing</li>
                </ul>
              </div>
              <div className="border border-gray-900 rounded p-6 bg-gray-900">
                <h3 className="font-semibold text-white text-lg">Verified Reports</h3>
                <p className="text-3xl font-bold text-white mt-2">TOKEN BASED</p>
                <p className="text-sm text-white/60 mt-1">One token per report</p>
                <ul className="mt-4 text-sm text-white/70 space-y-1">
                  <li>✓ Customer-verifiable reports</li>
                  <li>✓ QR code generation</li>
                  <li>✓ Professional format</li>
                </ul>
              </div>
            </div>

            {loadingPackages ? (
              <div className="text-center py-4 mt-8">
                <div className="inline-block w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 mt-2">Loading packages...</p>
              </div>
            ) : packages.length > 0 ? (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Packages</h3>
                <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-white border border-gray-200 rounded p-4 text-center hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{pkg.token_count}</p>
                      <p className="text-sm text-gray-500">tokens</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{pkg.currency || 'KES'} {pkg.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">KSh {(pkg.price / pkg.token_count).toFixed(2)} per token</p>
                      <Link
                        to="/register"
                        className="inline-block mt-3 px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors"
                      >
                        Get Started
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 text-sm text-gray-500">
                No token packages available at the moment.
              </div>
            )}

            <p className="text-sm text-gray-500 mt-6">
              Dealers can purchase tokens from their dashboard after creating an account.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Test with confidence. Sell with proof.</h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            Diagnose the device. Generate the report. Let the customer verify it.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              to="/register"
              className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium rounded transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
            >
              Download DDKv1.0
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home