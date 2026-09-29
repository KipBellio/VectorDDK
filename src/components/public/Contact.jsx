import { useState } from 'react'
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // In Phase 8, this will send email via Resend
    // For now, simulate
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Message sent! We\'ll get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-primary-900 py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Get in <span className="text-primary-400">Touch</span>
          </h1>
          <p className="text-xl text-navy-200 max-w-2xl mx-auto">
            Have questions? We're here to help you with everything VectorDDK.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-navy-900">Email</p>
                      <p className="text-navy-600">support@vectorddk.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-navy-900">Phone</p>
                      <p className="text-navy-600">+254 700 000 000</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-navy-900">Location</p>
                      <p className="text-navy-600">Nairobi, Kenya</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-navy-50 rounded-xl p-6">
                <h3 className="font-semibold text-navy-900 mb-2">Support Hours</h3>
                <p className="text-navy-600 text-sm">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-navy-600 text-sm">Saturday: 9:00 AM - 1:00 PM</p>
                <p className="text-navy-600 text-sm">Sunday: Closed</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-8">
                <h2 className="text-2xl font-bold text-navy-900 mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="input-field min-h-[120px]"
                      placeholder="Tell us about your inquiry..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                    {!loading && <Send className="ml-2 w-5 h-5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact