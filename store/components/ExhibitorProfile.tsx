'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ExhibitorEditForm from './ExhibitorEditForm'

interface ExhibitorProfileProps {
  userProfile: any
  onBack: () => void
}

interface ExhibitorData {
  id: string
  name: string
  gender: string
  age: number
  phone: string
  email: string
  genre: string
  genre_detail: string
  business_license: string | null
  vehicle_inspection: string | null
  automobile_inspection: string | null
  pl_insurance: string | null
  fire_equipment_layout: string | null
  line_user_id: string
  created_at: string
  updated_at: string
}

export default function ExhibitorProfile({ userProfile, onBack }: ExhibitorProfileProps) {
  const [exhibitorData, setExhibitorData] = useState<ExhibitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchExhibitorData()
  }, [])

  const fetchExhibitorData = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibitors')
        .select('*')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (error) throw error
      
      // デバッグ用ログ
      console.log('Fetched exhibitor data:', data)
      console.log('Image URLs:', {
        business_license: data?.business_license,
        vehicle_inspection: data?.vehicle_inspection,
        automobile_inspection: data?.automobile_inspection,
        pl_insurance: data?.pl_insurance,
        fire_equipment_layout: data?.fire_equipment_layout,
      })
      
      setExhibitorData(data)
    } catch (error) {
      console.error('Failed to fetch exhibitor data:', error)
      alert('プロフィール情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateComplete = (updatedData: ExhibitorData) => {
    setExhibitorData(updatedData)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (isEditing && exhibitorData) {
    return (
      <ExhibitorEditForm
        exhibitorData={exhibitorData}
        userProfile={userProfile}
        onUpdateComplete={handleUpdateComplete}
        onCancel={() => setIsEditing(false)}
      />
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
          <h1 className="text-2xl font-bold text-gray-800">登録情報</h1>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            編集
          </button>
        </div>

        {exhibitorData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前
                </label>
                <p className="text-gray-900">{exhibitorData.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性別
                </label>
                <p className="text-gray-900">{exhibitorData.gender}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年齢
                </label>
                <p className="text-gray-900">{exhibitorData.age}歳</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <p className="text-gray-900">{exhibitorData.phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <p className="text-gray-900">{exhibitorData.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ジャンル
                </label>
                <p className="text-gray-900">{exhibitorData.genre}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ジャンル詳細
                </label>
                <p className="text-gray-900">{exhibitorData.genre_detail}</p>
              </div>

              {/* 書類画像の表示 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  登録書類
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exhibitorData.business_license && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">営業許可証</p>
                      <img
                        src={exhibitorData.business_license}
                        alt="営業許可証"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {exhibitorData.vehicle_inspection && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">車検証</p>
                      <img
                        src={exhibitorData.vehicle_inspection}
                        alt="車検証"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {exhibitorData.automobile_inspection && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">自動車検査証</p>
                      <img
                        src={exhibitorData.automobile_inspection}
                        alt="自動車検査証"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {exhibitorData.pl_insurance && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">PL保険</p>
                      <img
                        src={exhibitorData.pl_insurance}
                        alt="PL保険"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {exhibitorData.fire_equipment_layout && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">火器類配置図</p>
                      <img
                        src={exhibitorData.fire_equipment_layout}
                        alt="火器類配置図"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登録日時
                </label>
                <p className="text-gray-900">
                  {new Date(exhibitorData.created_at).toLocaleString('ja-JP')}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最終更新日時
                </label>
                <p className="text-gray-900">
                  {new Date(exhibitorData.updated_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
