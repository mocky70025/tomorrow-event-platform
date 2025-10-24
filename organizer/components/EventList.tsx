'use client'

import { useState } from 'react'
import { supabase, type Event } from '@/lib/supabase'
import Image from 'next/image'

interface EventListProps {
  events: Event[]
  onEventUpdated: () => void
}

export default function EventList({ events, onEventUpdated }: EventListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (eventId: string) => {
    if (!confirm('このイベントを削除しますか？')) return

    setDeleting(eventId)
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      onEventUpdated()
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('イベントの削除に失敗しました。')
    } finally {
      setDeleting(null)
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">掲載中のイベントはありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          {event.main_image_url && (
            <div className="relative h-48 w-full">
              <Image
                src={event.main_image_url}
                alt={event.event_name}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {event.event_name}
            </h3>
            
            <div className="text-sm text-gray-600 mb-3">
              <p>開催期間: {event.event_display_period}</p>
              {event.event_time && <p>時間: {event.event_time}</p>}
              <p>会場: {event.venue_name}</p>
            </div>

            <p className="text-gray-700 text-sm mb-4">
              {event.lead_text}
            </p>

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                作成日: {new Date(event.created_at).toLocaleDateString('ja-JP')}
              </div>
              
              <button
                onClick={() => handleDelete(event.id)}
                disabled={deleting === event.id}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {deleting === event.id ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
