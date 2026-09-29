import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Zap, Clock, Users, Shield } from 'lucide-react'

const ForDealers = () => {
  return (
    <div>
      <section className="border-b border-[#E5E5E5] py-16 md:py-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[#111111] text-center">Built for device dealers.</h1>
            <p className="text-[#555555] text-center mt-2 max-w-2xl mx-auto">
              VectorDDK gives you the tools to test, verify, and sell used devices with confidence.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-10">
              <div className="border border-[#E5E5E5] rounded p-6 text-center hover:border-[#888888] transition-colors">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-[#555555]" />
                </div>
                <h3 className="font-semibold text-[#111111]">Test devices quickly</h3>
                <p className="text-sm text-[#555555] mt-1">Comprehensive diagnostics in minutes</p>
              </div>
              <div className="border border-[#E5E5E5] rounded p-6 text-center hover:border-[#888888] transition-colors">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-[#555555]" />
                </div>
                <h3 className="font-semibold text-[#111111]">Repeat diagnostics freely</h3>
                <p className="text-sm text-[#555555] mt-1">No limits, no token consumption</p>
              </div>
              <div className="border border-[#E5E5E5] rounded p-6 text-center hover:border-[#888888] transition-colors">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-[#555555]" />
                </div>
                <h3 className="font-semibold text-[#111111]">Generate reports when ready</h3>
                <p className="text-sm text-[#555555] mt-1">Only when the customer is present</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="border border-[#E5E5E5] rounded p-6 text-center hover:border-[#888888] transition-colors">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-[#555555]" />
                </div>
                <h3 className="font-semibold text-[#111111]">Build customer trust</h3>
                <p className="text-sm text-[#555555] mt-1">Verifiable reports build confidence</p>
              </div>
              <div className="border border-[#E5E5E5] rounded p-6 text-center hover:border-[#888888] transition-colors">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-[#555555]" />
                </div>
                <h3 className="font-semibold text-[#111111]">Grow your business</h3>
                <p className="text-sm text-[#555555] mt-1">Professional tools for professional dealers</p>
              </div>
              <div className="border border-[#E5E5E5] rounded p-6 text-center hover:border-[#888888] transition-colors">
                <div className="w-10 h-10 bg-[#F6F6F6] rounded flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-[#555555]" />
                </div>
                <h3 className="font-semibold text-[#111111]">Reduce returns</h3>
                <p className="text-sm text-[#555555] mt-1">Full transparency means fewer surprises</p>
              </div>
            </div>

            <div className="text-center mt-10 bg-[#F6F6F6] border border-[#E5E5E5] rounded p-8">
              <h2 className="text-xl font-bold text-[#111111]">Ready to become a VectorDDK dealer?</h2>
              <p className="text-[#555555] mt-1">Join dealers who trust VectorDDK.</p>
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors mt-4"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ForDealers