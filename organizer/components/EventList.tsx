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
      <div style={{
        background: '#FFFFFF',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '48px 24px',
        textAlign: 'center'
      }}>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          lineHeight: '150%',
          color: '#666666'
        }}>掲載中のイベントはありません</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {events.map((event) => {
        // @ts-ignore
        const approvalStatus = event.approval_status || 'pending'
        const statusColor = approvalStatus === 'approved' 
          ? { bg: '#E6F7ED', text: '#06C755' }
          : approvalStatus === 'rejected'
          ? { bg: '#FFE6E6', text: '#FF3B30' }
          : { bg: '#FFF9E6', text: '#B8860B' }
        const statusText = approvalStatus === 'approved' ? '承認済み' : approvalStatus === 'rejected' ? '却下' : '審査中'

        return (
          <div
            key={event.id}
            style={{
              background: '#FFFFFF',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            {event.main_image_url && (
              <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                <img
                  src={event.main_image_url}
                  alt={event.event_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#F7F7F7'
                  }}
                />
              </div>
            )}
            
            <div style={{ padding: '16px' }}>
              <h3 style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                lineHeight: '120%',
                color: '#000000',
                marginBottom: '12px'
              }}>
                {event.event_name}
              </h3>
              
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: '120%',
                color: '#666666',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <p>開催期間: {event.event_display_period}</p>
                {event.event_time && <p>時間: {event.event_time}</p>}
                <p>会場: {event.venue_name}</p>
              </div>

              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: '120%',
                color: '#000000',
                marginBottom: '16px'
              }}>
                {event.lead_text}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  lineHeight: '120%',
                  color: '#999999'
                }}>
                  作成日: {new Date(event.created_at).toLocaleDateString('ja-JP')}
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  background: statusColor.bg,
                  color: statusColor.text
                }}>
                  {statusText}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onViewApplications && onViewApplications(event)}
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
                  申し込み管理
                </button>
                <button
                  onClick={() => onEdit && onEdit(event)}
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
                  編集
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  style={{
                    padding: '8px 16px',
                    background: deleting === event.id ? '#D9D9D9' : '#FF3B30',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '120%',
                    cursor: deleting === event.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deleting === event.id ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
