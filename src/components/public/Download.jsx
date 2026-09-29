import { useState } from 'react'
import { 
  Download as DownloadIcon, 
  CheckCircle, 
  Info, 
  Monitor, 
  HardDrive, 
  Cpu,
  Shield,
  ArrowRight
} from 'lucide-react'

const DownloadPage = () => {
  const [downloading, setDownloading] = useState(false)

  const version = import.meta.env.VITE_DDK_VERSION || '1.0.0'
  const downloadUrl = import.meta.env.VITE_DDK_DOWNLOAD_URL || '/downloads/DDKv1.0.exe'

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      window.location.href = downloadUrl
      setDownloading(false)
    }, 1500)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-primary-900 py-20">
        <div className="container-custom text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary-800/50 text-primary-300 rounded-full text-sm font-semibold mb-6">
            <Monitor className="w-4 h-4 mr-2" />
            Windows Application
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Download <span className="text-primary-400">DDKv1.0</span>
          </h1>
          <p className="text-xl text-navy-200 max-w-2xl mx-auto">
            Professional device diagnostic application for Windows
          </p>
        </div>
      </section>

      {/* Download Card */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="card p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Monitor className="w-12 h-12 text-primary-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-navy-900">DDKv1.0.exe</h2>
                <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                  <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                    Version {version}
                  </span>
                  <span className="inline-flex items-center text-navy-500 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    Stable
                  </span>
                </div>
                <p className="text-navy-600 mt-4">
                  DDKv1.0 is the official Windows diagnostic application for testing laptops and smartphones.
                </p>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-6 btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? 'Starting download...' : 'Download DDKv1.0'}
                  {!downloading && <DownloadIcon className="ml-2 w-5 h-5" />}
                </button>
                <p className="text-xs text-navy-400 mt-2">
                  File size: ~25 MB | Windows 10 or later
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 bg-navy-50">
        <div className="container-custom max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-navy-900 mb-12">
            System Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-navy-100">
              <div className="flex items-center space-x-3 mb-4">
                <Cpu className="w-6 h-6 text-primary-500" />
                <h3 className="font-semibold text-navy-900">Minimum Requirements</h3>
              </div>
              <ul className="space-y-2 text-navy-600 text-sm">
                <li>• Windows 10 or later (64-bit)</li>
                <li>• Intel Core i3 or equivalent</li>
                <li>• 4GB RAM</li>
                <li>• 100MB free disk space</li>
                <li>• Internet connection</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-navy-100">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-primary-500" />
                <h3 className="font-semibold text-navy-900">Recommended</h3>
              </div>
              <ul className="space-y-2 text-navy-600 text-sm">
                <li>• Windows 11 (64-bit)</li>
                <li>• Intel Core i5 or better</li>
                <li>• 8GB RAM</li>
                <li>• 500MB free disk space</li>
                <li>• Stable internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Release Notes */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Info className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-navy-900">Release Notes</h2>
          </div>
          <div className="space-y-6">
            <div className="border-l-4 border-primary-500 pl-4">
              <div className="flex items-center space-x-4 mb-2">
                <span className="font-semibold text-navy-900">Version {version}</span>
                <span className="text-sm text-navy-500">Released December 2024</span>
              </div>
              <ul className="space-y-2 text-navy-600 text-sm">
                <li>• Initial release of DDKv1.0</li>
                <li>• Laptop diagnostic testing</li>
                <li>• Smartphone diagnostic testing</li>
                <li>• USB and wireless phone connection</li>
                <li>• QR code report generation</li>
                <li>• Secure authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DownloadPage