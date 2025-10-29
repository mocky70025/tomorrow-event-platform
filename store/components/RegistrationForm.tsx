'use client'

import { useState } from 'react'
import { supabase, type Exhibitor } from '@/lib/supabase'
import ImageUpload from './ImageUpload'

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

  const [documentUrls, setDocumentUrls] = useState({
    business_license: '',
    vehicle_inspection: '',
    automobile_inspection: '',
    pl_insurance: '',
    fire_equipment_layout: '',
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

      // 書類のURLを設定
      const documentImageUrls: Partial<Exhibitor> = {}
      
      if (documentUrls.business_license) {
        documentImageUrls.business_license_image_url = documentUrls.business_license
      }
      if (documentUrls.vehicle_inspection) {
        documentImageUrls.vehicle_inspection_image_url = documentUrls.vehicle_inspection
      }
      if (documentUrls.automobile_inspection) {
        documentImageUrls.automobile_inspection_image_url = documentUrls.automobile_inspection
      }
      if (documentUrls.pl_insurance) {
        documentImageUrls.pl_insurance_image_url = documentUrls.pl_insurance
      }
      if (documentUrls.fire_equipment_layout) {
        documentImageUrls.fire_equipment_layout_image_url = documentUrls.fire_equipment_layout
      }

      const { error } = await supabase
        .from('exhibitors')
        .insert({
          ...formData,
          ...documentImageUrls,
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
            
            <div className="space-y-6">
              <ImageUpload
                label="営業許可証"
                documentType="business_license"
                userId={userProfile.userId}
                onUploadComplete={(url) => {
                  console.log('Business license uploaded:', url)
                  alert(`営業許可証アップロード成功！\nURL: ${url}`)
                  setDocumentUrls(prev => ({ ...prev, business_license: url }))
                }}
                onUploadError={(error) => {
                  console.error('Business license upload error:', error)
                  alert(`営業許可証アップロード失敗！\nエラー: ${error}`)
                }}
              />
              
              <ImageUpload
                label="車検証"
                documentType="vehicle_inspection"
                userId={userProfile.userId}
                onUploadComplete={(url) => {
                  console.log('Vehicle inspection uploaded:', url)
                  alert(`車検証アップロード成功！\nURL: ${url}`)
                  setDocumentUrls(prev => ({ ...prev, vehicle_inspection: url }))
                }}
                onUploadError={(error) => {
                  console.error('Vehicle inspection upload error:', error)
                  alert(`車検証アップロード失敗！\nエラー: ${error}`)
                }}
              />
              
              <ImageUpload
                label="自動車検査証"
                documentType="automobile_inspection"
                userId={userProfile.userId}
                onUploadComplete={(url) => {
                  console.log('Automobile inspection uploaded:', url)
                  alert(`自動車検査証アップロード成功！\nURL: ${url}`)
                  setDocumentUrls(prev => ({ ...prev, automobile_inspection: url }))
                }}
                onUploadError={(error) => {
                  console.error('Automobile inspection upload error:', error)
                  alert(`自動車検査証アップロード失敗！\nエラー: ${error}`)
                }}
              />
              
              <ImageUpload
                label="PL保険"
                documentType="pl_insurance"
                userId={userProfile.userId}
                onUploadComplete={(url) => {
                  console.log('PL insurance uploaded:', url)
                  alert(`PL保険アップロード成功！\nURL: ${url}`)
                  setDocumentUrls(prev => ({ ...prev, pl_insurance: url }))
                }}
                onUploadError={(error) => {
                  console.error('PL insurance upload error:', error)
                  alert(`PL保険アップロード失敗！\nエラー: ${error}`)
                }}
              />
              
              <ImageUpload
                label="火器類配置図"
                documentType="fire_equipment_layout"
                userId={userProfile.userId}
                onUploadComplete={(url) => {
                  console.log('Fire equipment layout uploaded:', url)
                  alert(`火器類配置図アップロード成功！\nURL: ${url}`)
                  setDocumentUrls(prev => ({ ...prev, fire_equipment_layout: url }))
                }}
                onUploadError={(error) => {
                  console.error('Fire equipment layout upload error:', error)
                  alert(`火器類配置図アップロード失敗！\nエラー: ${error}`)
                }}
              />
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
