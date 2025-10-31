'use client'

import { useState, useEffect } from 'react'
import { supabase, type Event, type Organizer } from '@/lib/supabase'
import EventForm from './EventForm'
import EventList from './EventList'
import EventApplications from './EventApplications'

interface EventManagementProps {
  userProfile: any
}

export default function EventManagement({ userProfile }: EventManagementProps) {
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)
  const [eventForApplications, setEventForApplications] = useState<Event | null>(null)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">主催者情報が見つかりません</p>
        </div>
      </div>
    )
  }

  if (!organizer.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              承認待ち
            </h2>
            <p className="text-yellow-700">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">イベント管理</h1>
          <button
            onClick={() => setShowEventForm(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
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
}
