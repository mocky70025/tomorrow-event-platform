'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  event_name: string
  event_name_furigana: string
  genre: string
  event_start_date: string
  event_end_date: string
  event_display_period: string
  event_time?: string
  lead_text: string
  event_description: string
  venue_name: string
  venue_city?: string
  main_image_url?: string
  main_image_caption?: string
  homepage_url?: string
  created_at: string
}

interface EventListProps {
  userProfile: any
  onBack: () => void
}

export default function EventList({ userProfile, onBack }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('approval_status', 'approved')
        .order('event_start_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
      alert('イベント一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleApply = async (eventId: string) => {
    try {
      // 出店者情報を取得
      const { data: exhibitor } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (!exhibitor) {
        alert('出店者登録が完了していません。まず登録を行ってください。')
        return
      }

      // 申し込み状況をチェック
      const { data: existingApplication } = await supabase
        .from('event_applications')
        .select('id')
        .eq('exhibitor_id', exhibitor.id)
        .eq('event_id', eventId)
        .single()

      if (existingApplication) {
        alert('既にこのイベントに申し込み済みです。')
        return
      }

      // 申し込みを登録
      const { error } = await supabase
        .from('event_applications')
        .insert({
          exhibitor_id: exhibitor.id,
          event_id: eventId,
          application_status: 'pending'
        })

      if (error) throw error

      alert('出店申し込みが完了しました。')
      setSelectedEvent(null)
    } catch (error) {
      console.error('Application failed:', error)
      alert('申し込みに失敗しました。')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">イベント一覧を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-blue-500 hover:text-blue-600 flex items-center"
            >
              ← 戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-800">イベント詳細</h1>
            <div></div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedEvent.main_image_url && (
              <div className="mb-6">
                <img
                  src={selectedEvent.main_image_url}
                  alt={selectedEvent.main_image_caption || selectedEvent.event_name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {selectedEvent.main_image_caption && (
                  <p className="text-sm text-gray-600 mt-2">{selectedEvent.main_image_caption}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedEvent.event_name}</h2>
                <p className="text-gray-600">{selectedEvent.event_name_furigana}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ジャンル</label>
                  <p className="text-gray-900">{selectedEvent.genre}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開催期間</label>
                  <p className="text-gray-900">
                    {formatDate(selectedEvent.event_start_date)} 〜 {formatDate(selectedEvent.event_end_date)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開催時間</label>
                  <p className="text-gray-900">{selectedEvent.event_time || '未定'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会場</label>
                  <p className="text-gray-900">{selectedEvent.venue_name}</p>
                  {selectedEvent.venue_city && (
                    <p className="text-sm text-gray-600">{selectedEvent.venue_city}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">リード文</label>
                <p className="text-gray-900">{selectedEvent.lead_text}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">イベント説明</label>
                <p className="text-gray-900">{selectedEvent.event_description}</p>
              </div>

              {selectedEvent.homepage_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公式サイト</label>
                  <a
                    href={selectedEvent.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    {selectedEvent.homepage_url}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => handleApply(selectedEvent.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                出店申し込み
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-600 flex items-center"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">イベント一覧</h1>
          <div></div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">開催予定のイベントがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                {event.main_image_url && (
                  <img
                    src={event.main_image_url}
                    alt={event.event_name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{event.event_name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{event.genre}</p>
                  <p className="text-gray-500 text-sm">
                    {formatDate(event.event_start_date)} 〜 {formatDate(event.event_end_date)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">{event.venue_name}</p>
                  <p className="text-gray-700 text-sm mt-2 line-clamp-2">{event.lead_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}