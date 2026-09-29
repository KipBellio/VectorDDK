import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const DealerRoute = ({ children }) => {
  const [isDealer, setIsDealer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkDealer = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsDealer(false)
          setLoading(false)
          return
        }

        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', session.user.email)
          .single()

        if (adminData) {
          await supabase.auth.signOut()
          setIsDealer(false)
          setLoading(false)
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, status')
          .eq('email', session.user.email)
          .single()

        if (profileError || !profileData) {
          setIsDealer(false)
          setLoading(false)
          return
        }

        if (profileData.status !== 'active') {
          setIsDealer(false)
          setLoading(false)
          return
        }

        const { data: dealerData } = await supabase
          .from('dealers')
          .select('id')
          .eq('profile_id', profileData.id)
          .single()

        if (!dealerData) {
          setIsDealer(false)
          setLoading(false)
          return
        }

        setIsDealer(true)
        setLoading(false)

      } catch (error) {
        console.error('Dealer check error:', error)
        setIsDealer(false)
        setLoading(false)
      }
    }

    checkDealer()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6]">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isDealer) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default DealerRoute