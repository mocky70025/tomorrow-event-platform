'use client'

import { useEffect, useState } from 'react'
import { liff } from '@line/liff'
import { supabase } from '@/lib/supabase'
import WelcomeScreen from '@/components/WelcomeScreen'
import RegistrationForm from '@/components/RegistrationForm'
import EventList from '@/components/EventList'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Home() {
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        setIsLiffReady(true)

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setUserProfile(profile)
          
          // 既存ユーザーかチェック
          const { data: existingUser } = await supabase
            .from('exhibitors')
            .select('*')
            .eq('line_user_id', profile.userId)
            .single()

          setIsRegistered(!!existingUser)
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeLiff()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isLiffReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">LINEアプリで開いてください</h1>
        </div>
      </div>
    )
  }

  if (!liff.isLoggedIn()) {
    return <WelcomeScreen />
  }

  if (!isRegistered) {
    return <RegistrationForm userProfile={userProfile} onRegistrationComplete={() => setIsRegistered(true)} />
  }

  return <EventList userProfile={userProfile} />
}
