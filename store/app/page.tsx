'use client'

import { useEffect, useState } from 'react'
import { liff } from '@line/liff'
import { supabase } from '@/lib/supabase'
import WelcomeScreen from '@/components/WelcomeScreen'
import RegistrationForm from '@/components/RegistrationForm'
import EventList from '@/components/EventList'
import ExhibitorProfile from '@/components/ExhibitorProfile'
import ApplicationManagement from '@/components/ApplicationManagement'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Home() {
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'events' | 'profile' | 'applications'>('events')

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'events':
        return <EventList userProfile={userProfile} onBack={() => setCurrentView('events')} />
      case 'profile':
        return <ExhibitorProfile userProfile={userProfile} onBack={() => setCurrentView('events')} />
      case 'applications':
        return <ApplicationManagement userProfile={userProfile} onBack={() => setCurrentView('events')} />
      default:
        return <EventList userProfile={userProfile} onBack={() => setCurrentView('events')} />
    }
  }

  const tabItems: Array<{ key: typeof currentView; label: string; icon: string }> = [
    { key: 'events', label: 'イベント', icon: '📅' },
    { key: 'profile', label: '登録情報', icon: '👤' },
    { key: 'applications', label: '申し込み', icon: '✅' }
  ]

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 88px)' }}>
      {renderCurrentView()}

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderTop: '1px solid #E5E5E5',
          boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.08)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 8px)',
          paddingTop: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '394px', margin: '0 auto' }}>
          {tabItems.map((item) => {
            const isActive = currentView === item.key
            const activeColor = '#06C755'
            const inactiveColor = '#666666'
            return (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <span style={{ fontSize: '20px', color: isActive ? activeColor : inactiveColor }}>{item.icon}</span>
                <span style={{ fontSize: '12px', color: isActive ? activeColor : inactiveColor }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
