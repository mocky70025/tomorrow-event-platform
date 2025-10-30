'use client'

import { useState, useEffect } from 'react'
import { supabase, type Organizer, type Event, type Application } from '@/lib/supabase'

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'organizers' | 'events' | 'applications'>('organizers')
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 主催者一覧を取得
      const { data: organizersData } = await supabase
        .from('organizers')
        .select('*')
        .order('created_at', { ascending: false })

      // イベント一覧を取得
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      // 申し込み一覧を取得
      const { data: applicationsData } = await supabase
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
          ),
          event:events(
            id,
            event_name,
            event_start_date,
            event_end_date,
            venue_name
          )
        `)
        .order('applied_at', { ascending: false })

      setOrganizers(organizersData || [])
      setEvents(eventsData || [])
      
      // 申し込みデータを正しい型に変換
      const applications = (applicationsData || []).map((app: any) => ({
        id: app.id,
        application_status: app.application_status,
        applied_at: app.applied_at,
        exhibitor: Array.isArray(app.exhibitor) ? app.exhibitor[0] : app.exhibitor,
        event: Array.isArray(app.event) ? app.event[0] : app.event
      }))
      setApplications(applications)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrganizerApproval = async (organizerId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('organizers')
        .update({ is_approved: approved })
        .eq('id', organizerId)

      if (error) throw error

      // データを再取得
      await fetchData()
      alert(approved ? '主催者を承認しました' : '主催者の承認を取り消しました')
    } catch (error) {
      console.error('Failed to update organizer:', error)
      alert('更新に失敗しました')
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
      await fetchData()
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Tomorrow - 運営管理</h1>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('organizers')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'organizers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              主催者承認 ({organizers.filter(o => !o.is_approved).length})
            </button>
            <button
              onClick={() => setCurrentView('events')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              イベント管理 ({events.length})
            </button>
            <button
              onClick={() => setCurrentView('applications')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              出店申し込み ({applications.filter(a => a.application_status === 'pending').length})
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {currentView === 'organizers' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">主催者承認</h2>
            {organizers.length === 0 ? (
              <p className="text-gray-500">主催者登録がありません</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizers.map((organizer) => (
                  <div key={organizer.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{organizer.company_name}</h3>
                        <p className="text-gray-600">{organizer.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        organizer.is_approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {organizer.is_approved ? '承認済み' : '未承認'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p>電話: {organizer.phone_number}</p>
                      <p>メール: {organizer.email}</p>
                      <p>登録日: {formatDate(organizer.created_at)}</p>
                    </div>

                    {!organizer.is_approved && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOrganizerApproval(organizer.id, true)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleOrganizerApproval(organizer.id, false)}
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
        )}

        {currentView === 'events' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">イベント管理</h2>
            {events.length === 0 ? (
              <p className="text-gray-500">イベントがありません</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{event.event_name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{event.genre}</p>
                    <p className="text-gray-500 text-sm">
                      {formatDate(event.event_start_date)} 〜 {formatDate(event.event_end_date)}
                    </p>
                    <p className="text-gray-500 text-sm">{event.venue_name}</p>
                    <p className="text-gray-700 text-sm mt-2">{event.lead_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">出店申し込み管理</h2>
            {applications.length === 0 ? (
              <p className="text-gray-500">申し込みがありません</p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{application.event.event_name}</h3>
                        <p className="text-gray-600">出店者: {application.exhibitor.name}</p>
                        <p className="text-gray-500 text-sm">{application.exhibitor.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.application_status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : application.application_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.application_status === 'approved' ? '承認済み' : 
                         application.application_status === 'rejected' ? '却下' : '審査中'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>会場: {application.event.venue_name}</p>
                      <p>開催期間: {formatDate(application.event.event_start_date)} 〜 {formatDate(application.event.event_end_date)}</p>
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
        )}
      </div>
    </div>
  )
}
