'use client'

import { useState } from 'react'
import { supabase, type Event } from '@/lib/supabase'
import Image from 'next/image'

interface EventCardProps {
  event: Event
  userProfile: any
}

export default function EventCard({ event, userProfile }: EventCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    setApplying(true)
    try {
      // 出店者情報を取得
      const { data: exhibitor } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (!exhibitor) {
        throw new Error('出店者情報が見つかりません')
      }

      // 申し込みを登録
      const { error } = await supabase
        .from('event_applications')
        .insert({
          exhibitor_id: exhibitor.id,
          event_id: event.id,
          application_status: 'pending'
        })

      if (error) throw error

      alert('申し込みが完了しました！')
    } catch (error) {
      console.error('Application failed:', error)
      alert('申し込みに失敗しました。もう一度お試しください。')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
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

        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            {showDetails ? '詳細を閉じる' : '詳細を見る'}
          </button>
          
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors"
          >
            {applying ? '申し込み中...' : 'このイベントに申し込む'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">イベント詳細</h4>
            <p className="text-gray-700 text-sm">
              {event.event_description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
