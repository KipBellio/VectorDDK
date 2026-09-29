import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { path: '/', label: 'Product' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/for-dealers', label: 'For Dealers' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/verify', label: 'Verify Report' },
    { path: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
        : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/20 group-hover:shadow-gray-900/40 transition-all duration-300">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Vector<span className="text-gray-500">DDK</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 relative ${
                  location.pathname === link.path
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 border-t border-gray-100 bg-white/95 backdrop-blur-md">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 px-4 text-base font-medium rounded-lg transition-colors ${
                  location.pathname === link.path
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 px-4">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="py-3 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="py-3 bg-gray-900 hover:bg-gray-800 text-white text-center font-semibold rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar