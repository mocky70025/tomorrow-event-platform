'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Application {
  id: string
  application_status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  event: {
    id: string
    event_name: string
    event_start_date: string
    event_end_date: string
    venue_name: string
    main_image_url?: string
  }
}

interface ApplicationManagementProps {
  userProfile: any
  onBack: () => void
}

export default function ApplicationManagement({ userProfile, onBack }: ApplicationManagementProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      // 出店者情報を取得
      const { data: exhibitor } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (!exhibitor) {
        alert('出店者登録が完了していません。')
        return
      }

      // 申し込み一覧を取得
      const { data, error } = await supabase
        .from('event_applications')
        .select(`
          id,
          application_status,
          applied_at,
          event:events(
            id,
            event_name,
            event_start_date,
            event_end_date,
            venue_name,
            main_image_url
          )
        `)
        .eq('exhibitor_id', exhibitor.id)
        .order('applied_at', { ascending: false })

      if (error) throw error
      
      // データを正しい型に変換
      const applications = (data || []).map((app: any) => ({
        id: app.id,
        application_status: app.application_status,
        applied_at: app.applied_at,
        event: Array.isArray(app.event) ? app.event[0] : app.event
      }))
      
      setApplications(applications)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      alert('申し込み一覧の取得に失敗しました')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FFF9E6', text: '#B8860B' }
      case 'approved':
        return { bg: '#E6F7ED', text: '#06C755' }
      case 'rejected':
        return { bg: '#FFE6E6', text: '#FF3B30' }
      default:
        return { bg: '#F7F7F7', text: '#666666' }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '審査中'
      case 'approved':
        return '承認済み'
      case 'rejected':
        return '却下'
      default:
        return '不明'
    }
  }

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
          }}>申し込み一覧を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={{ marginBottom: '24px', paddingTop: '24px' }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            textAlign: 'center'
          }}>申し込み管理</h1>
        </div>

        {applications.length === 0 ? (
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
              color: '#666666',
              marginBottom: '8px'
            }}>申し込み履歴がありません</p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '120%',
              color: '#999999',
              marginTop: '8px'
            }}>イベント一覧から出店申し込みを行ってください</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {applications.map((application) => {
              const statusColor = getStatusColor(application.application_status)
              return (
                <div
                  key={application.id}
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: 700,
                        lineHeight: '120%',
                        color: '#000000',
                        marginBottom: '8px'
                      }}>
                        {application.event.event_name}
                      </h3>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        lineHeight: '120%',
                        color: '#666666',
                        marginBottom: '4px'
                      }}>
                        {formatDate(application.event.event_start_date)} 〜 {formatDate(application.event.event_end_date)}
                      </p>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        lineHeight: '120%',
                        color: '#666666'
                      }}>{application.event.venue_name}</p>
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
                      {getStatusText(application.application_status)}
                    </span>
                  </div>

                  {application.event.main_image_url && (
                    <div style={{ marginBottom: '16px' }}>
                      <img
                        src={application.event.main_image_url}
                        alt={application.event.event_name}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          background: '#F7F7F7'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '120%',
                      color: '#666666'
                    }}>申し込み日: {formatDate(application.applied_at)}</span>
                    {application.application_status === 'approved' && (
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '120%',
                        color: '#06C755'
                      }}>✓ 出店可能</span>
                    )}
                    {application.application_status === 'rejected' && (
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '120%',
                        color: '#FF3B30'
                      }}>✗ 出店不可</span>
                    )}
                    {application.application_status === 'pending' && (
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '120%',
                        color: '#B8860B'
                      }}>⏳ 審査中</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
