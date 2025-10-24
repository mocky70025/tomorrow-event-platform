'use client'

import { useState } from 'react'
import { supabase, type Exhibitor } from '@/lib/supabase'

interface RegistrationFormProps {
  userProfile: any
  onRegistrationComplete: () => void
}

export default function RegistrationForm({ userProfile, onRegistrationComplete }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    gender: '男' as '男' | '女' | 'それ以外',
    age: 0,
    phone_number: '',
    email: '',
    genre_category: '',
    genre_free_text: '',
  })

  const [documents, setDocuments] = useState({
    business_license: null as File | null,
    vehicle_inspection: null as File | null,
    automobile_inspection: null as File | null,
    pl_insurance: null as File | null,
    fire_equipment_layout: null as File | null,
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 重複登録チェック
      const { data: existingUser } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (existingUser) {
        alert('既に登録済みです。')
        return
      }

      // 書類のアップロード（実際の実装ではSupabase Storageを使用）
      const documentUrls: Partial<Exhibitor> = {}
      
      // ここで実際のファイルアップロード処理を行う
      // 今回は仮のURLを設定
      if (documents.business_license) {
        documentUrls.business_license_image_url = 'uploaded_url_1'
      }
      if (documents.vehicle_inspection) {
        documentUrls.vehicle_inspection_image_url = 'uploaded_url_2'
      }
      if (documents.automobile_inspection) {
        documentUrls.automobile_inspection_image_url = 'uploaded_url_3'
      }
      if (documents.pl_insurance) {
        documentUrls.pl_insurance_image_url = 'uploaded_url_4'
      }
      if (documents.fire_equipment_layout) {
        documentUrls.fire_equipment_layout_image_url = 'uploaded_url_5'
      }

      const { error } = await supabase
        .from('exhibitors')
        .insert({
          ...formData,
          ...documentUrls,
          line_user_id: userProfile.userId,
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      onRegistrationComplete()
    } catch (error) {
      console.error('Registration failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`登録に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新規登録</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">基本情報</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性別 *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="それ以外">それ以外</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年齢 *
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ジャンル（プルダウン）
                </label>
                <select
                  value={formData.genre_category}
                  onChange={(e) => setFormData({ ...formData, genre_category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  <option value="飲食">飲食</option>
                  <option value="物販">物販</option>
                  <option value="サービス">サービス</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ジャンル（自由回答）
                </label>
                <textarea
                  value={formData.genre_free_text}
                  onChange={(e) => setFormData({ ...formData, genre_free_text: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 必要書類 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">必要書類</h2>
            
            <div className="space-y-4">
              {[
                { key: 'business_license', label: '営業許可証' },
                { key: 'vehicle_inspection', label: '車検証' },
                { key: 'automobile_inspection', label: '自動車検査証' },
                { key: 'pl_insurance', label: 'PL保険' },
                { key: 'fire_equipment_layout', label: '火器類配置図' },
              ].map((doc) => (
                <div key={doc.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {doc.label}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocuments({ ...documents, [doc.key]: file })
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
