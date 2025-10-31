'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Application {
  id: string
  application_status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  exhibitor: {
    id: string
    name: string
    email: string
    phone_number: string
  }
}

interface EventApplicationsProps {
  eventId: string
  eventName: string
  onBack: () => void
}

export default function EventApplications({ eventId, eventName, onBack }: EventApplicationsProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [eventId])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('event_applications')
        .select(`
          id,
          application_status,
          applied_at,
          exhibitor:exhibitors(
            id,
            name,
            email,
            phone_number
          )
        `)
        .eq('event_id', eventId)
        .order('applied_at', { ascending: false })

      if (error) throw error

      // データを正しい型に変換
      const applicationsData = (data || []).map((app: any) => ({
        id: app.id,
        application_status: app.application_status,
        applied_at: app.applied_at,
        exhibitor: Array.isArray(app.exhibitor) ? app.exhibitor[0] : app.exhibitor
      }))

      setApplications(applicationsData)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      alert('申し込み一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationApproval = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('event_applications')
        .update({ application_status: status })
        .eq('id', applicationId)

      if (error) throw error

      // データを再取得
      await fetchApplications()
      alert(status === 'approved' ? '申し込みを承認しました' : '申し込みを却下しました')
    } catch (error) {
      console.error('Failed to update application:', error)
      alert('更新に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
            className="text-purple-500 hover:text-purple-600 flex items-center"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold text-gray-800">出店申し込み管理</h1>
          <div></div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">{eventName}</h2>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">このイベントへの出店申し込みはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {application.exhibitor.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{application.exhibitor.email}</p>
                    <p className="text-gray-600 text-sm">電話: {application.exhibitor.phone_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.application_status)}`}>
                    {getStatusText(application.application_status)}
                  </span>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p>申し込み日: {formatDate(application.applied_at)}</p>
                </div>

                {application.application_status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApplicationApproval(application.id, 'approved')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleApplicationApproval(application.id, 'rejected')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      却下
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
