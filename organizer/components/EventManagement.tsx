'use client'

import { useState, useEffect } from 'react'
import { supabase, type Event, type Organizer } from '@/lib/supabase'
import EventForm from './EventForm'
import EventList from './EventList'
import EventApplications from './EventApplications'
import OrganizerProfile from './OrganizerProfile'

interface EventManagementProps {
  userProfile: any
}

export default function EventManagement({ userProfile }: EventManagementProps) {
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)
  const [eventForApplications, setEventForApplications] = useState<Event | null>(null)
  const [currentView, setCurrentView] = useState<'events' | 'profile'>('events')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizerData()
  }, [userProfile])

  const fetchOrganizerData = async () => {
    try {
      // 主催者情報を取得
      const { data: organizerData } = await supabase
        .from('organizers')
        .select('*')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (organizerData) {
        setOrganizer(organizerData)
        
        // 主催者のイベント一覧を取得
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', organizerData.id)
          .order('created_at', { ascending: false })

        setEvents(eventsData || [])
      }
    } catch (error) {
      console.error('Failed to fetch organizer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventCreated = (savedEvent: Event) => {
    // 更新の場合: 既存のイベントを置き換え
    // 作成の場合: 先頭に追加
    const existingIndex = events.findIndex(e => e.id === savedEvent.id)
    if (existingIndex >= 0) {
      // 更新: 既存イベントを置き換え
      const updatedEvents = [...events]
      updatedEvents[existingIndex] = savedEvent
      setEvents(updatedEvents)
    } else {
      // 新規: 先頭に追加
      setEvents([savedEvent, ...events])
    }
    setShowEventForm(false)
    setEventToEdit(null)
  }

  // 編集イベントを受け取るカスタムイベント
  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.id
      const target = events.find(ev => ev.id === id)
      if (target) {
        setEventToEdit(target)
        setShowEventForm(true)
      }
    }
    window.addEventListener('edit-event', handler)
    return () => window.removeEventListener('edit-event', handler)
  }, [events])

  if (loading) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #E5E5E5',
            borderTopColor: '#06C755',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '150%',
            color: '#666666'
          }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!organizer) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '150%',
            color: '#666666'
          }}>主催者情報が見つかりません</p>
        </div>
      </div>
    )
  }

  if (!organizer.is_approved) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
          <div style={{
            background: '#FFF9E6',
            border: '1px solid #F5D76E',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginTop: '24px'
          }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: 700,
              lineHeight: '120%',
              color: '#B8860B',
              marginBottom: '8px'
            }}>
              承認待ち
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#B8860B'
            }}>
              運営側の承認をお待ちください。承認後、イベントの掲載が可能になります。
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showEventForm) {
    return (
      <EventForm
        organizer={organizer}
        onEventCreated={handleEventCreated}
        // @ts-ignore
        initialEvent={eventToEdit || undefined}
        onCancel={() => {
          setShowEventForm(false)
          setEventToEdit(null)
        }}
      />
    )
  }

  if (eventForApplications) {
    return (
      <EventApplications
        eventId={eventForApplications.id}
        eventName={eventForApplications.event_name}
        onBack={() => setEventForApplications(null)}
      />
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'events':
        return (
          <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
            <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px', paddingBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
                <h1 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  lineHeight: '120%',
                  color: '#000000'
                }}>イベント管理</h1>
                <button
                  onClick={() => setShowEventForm(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#06C755',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '120%',
                    cursor: 'pointer'
                  }}
                >
                  新しいイベントを掲載
                </button>
              </div>

              <EventList 
                events={events} 
                onEventUpdated={fetchOrganizerData}
                onEdit={(ev) => { setEventToEdit(ev); setShowEventForm(true) }}
                onViewApplications={(ev) => { setEventForApplications(ev) }}
              />
            </div>
          </div>
        )
      case 'profile':
        return (
          <div style={{ paddingBottom: '24px' }}>
            <OrganizerProfile userProfile={userProfile} />
          </div>
        )
      default:
        return null
    }
  }

  const tabItems: Array<{ key: typeof currentView; label: string; icon: string }> = [
    { key: 'events', label: 'イベント', icon: '📅' },
    { key: 'profile', label: '登録情報', icon: '👤' }
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
