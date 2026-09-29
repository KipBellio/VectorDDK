import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    { step: '01', title: 'Create your VectorDDK account.', desc: 'Sign up on the VectorDDK website' },
    { step: '02', title: 'Download DDKv1.0.', desc: 'Install the Windows application' },
    { step: '03', title: 'Sign in to DDKv1.0.', desc: 'Authenticate with your account' },
    { step: '04', title: 'Test the laptop or smartphone.', desc: 'Run comprehensive diagnostics' },
    { step: '05', title: 'Review the diagnostic results.', desc: 'Review with your customer' },
    { step: '06', title: 'Generate a customer-verifiable report.', desc: 'When the customer is ready' },
  ]

  return (
    <div>
      <section className="border-b border-[#E5E5E5] py-16 md:py-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[#111111] text-center">How VectorDDK Works</h1>
            <p className="text-[#555555] text-center mt-2">Six steps to verified device reports</p>

            <div className="mt-10 space-y-4">
              {steps.map((item) => (
                <div key={item.step} className="border border-[#E5E5E5] rounded p-5 flex items-start gap-4 hover:border-[#888888] transition-colors">
                  <span className="text-sm font-mono text-[#555555] min-w-[32px]">{item.step}</span>
                  <div>
                    <h3 className="font-medium text-[#111111]">{item.title}</h3>
                    <p className="text-sm text-[#555555]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-4 border border-[#E5E5E5] rounded p-6 bg-[#F6F6F6]">
              <div className="text-center">
                <span className="text-xs font-semibold text-[#555555] uppercase tracking-wider">Testing</span>
                <p className="text-2xl font-bold text-[#111111]">FREE + UNLIMITED</p>
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-[#555555] uppercase tracking-wider">Verified Report</span>
                <p className="text-2xl font-bold text-[#111111]">1 TOKEN</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium rounded transition-colors"
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

export default HowItWorks