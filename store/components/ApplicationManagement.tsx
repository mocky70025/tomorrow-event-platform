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
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">申し込み一覧を読み込み中...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">申し込み管理</h1>
          <div></div>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">申し込み履歴がありません</p>
            <p className="text-gray-400 text-sm mt-2">イベント一覧から出店申し込みを行ってください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {application.event.event_name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {formatDate(application.event.event_start_date)} 〜 {formatDate(application.event.event_end_date)}
                    </p>
                    <p className="text-gray-500 text-sm">{application.event.venue_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.application_status)}`}>
                    {getStatusText(application.application_status)}
                  </span>
                </div>

                {application.event.main_image_url && (
                  <div className="mb-4">
                    <img
                      src={application.event.main_image_url}
                      alt={application.event.event_name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>申し込み日: {formatDate(application.applied_at)}</span>
                  {application.application_status === 'approved' && (
                    <span className="text-green-600 font-medium">✓ 出店可能</span>
                  )}
                  {application.application_status === 'rejected' && (
                    <span className="text-red-600 font-medium">✗ 出店不可</span>
                  )}
                  {application.application_status === 'pending' && (
                    <span className="text-yellow-600 font-medium">⏳ 審査中</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
