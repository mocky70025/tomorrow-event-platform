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

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      {/* ナビゲーションバー */}
      <div style={{
        background: '#FFFFFF',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #E5E5E5'
      }}>
        <div className="container mx-auto" style={{ padding: '16px', maxWidth: '394px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: '120%',
              color: '#000000',
              textAlign: 'center'
            }}>
              出店者向け
            </h1>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setCurrentView('events')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: currentView === 'events' ? '#FFFFFF' : '#666666',
                  background: currentView === 'events' ? '#06C755' : '#F7F7F7',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                イベント一覧
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: currentView === 'profile' ? '#FFFFFF' : '#666666',
                  background: currentView === 'profile' ? '#06C755' : '#F7F7F7',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                登録情報
              </button>
              <button
                onClick={() => setCurrentView('applications')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: currentView === 'applications' ? '#FFFFFF' : '#666666',
                  background: currentView === 'applications' ? '#06C755' : '#F7F7F7',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                申し込み管理
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      {renderCurrentView()}
    </div>
  )
}
