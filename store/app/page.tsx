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
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Tomorrow - 出店者向け</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('events')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'events' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                イベント一覧
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'profile' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                登録情報
              </button>
              <button
                onClick={() => setCurrentView('applications')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'applications' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
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
