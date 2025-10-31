'use client'

import { useState } from 'react'
import { supabase, type Event } from '@/lib/supabase'

interface EventListProps {
  events: Event[]
  onEventUpdated: () => void
  onEdit?: (event: Event) => void
  onViewApplications?: (event: Event) => void
}

export default function EventList({ events, onEventUpdated, onEdit, onViewApplications }: EventListProps) {
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
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={event.main_image_url}
                alt={event.event_name}
                className="w-full h-full object-cover"
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
              <div className="flex items-center space-x-2 flex-wrap">
                {/* 承認ステータス表示 */}
                {'approval_status' in event && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    // @ts-ignore
                    event.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      // @ts-ignore
                      : event.approval_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {/* @ts-ignore */}
                    {event.approval_status === 'approved' ? '承認済み' :
                    // @ts-ignore
                    event.approval_status === 'rejected' ? '却下' : '審査中'}
                  </span>
                )}
                <button
                  onClick={() => onViewApplications && onViewApplications(event)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  申し込み管理
                </button>
                <button
                  onClick={() => onEdit && onEdit(event)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  編集
                </button>
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
        </div>
      ))}
    </div>
  )
}
