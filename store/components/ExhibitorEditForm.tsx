'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import ImageUpload from './ImageUpload'

interface ExhibitorEditFormProps {
  exhibitorData: any
  userProfile: any
  onUpdateComplete: (updatedData: any) => void
  onCancel: () => void
}

export default function ExhibitorEditForm({
  exhibitorData,
  userProfile,
  onUpdateComplete,
  onCancel
}: ExhibitorEditFormProps) {
  const [formData, setFormData] = useState({
    name: exhibitorData.name || '',
    gender: exhibitorData.gender || '',
    age: exhibitorData.age || '',
    phone_number: exhibitorData.phone_number || '',
    email: exhibitorData.email || '',
    genre_category: exhibitorData.genre_category || '',
    genre_free_text: exhibitorData.genre_free_text || '',
  })

  const [imageUrls, setImageUrls] = useState({
    business_license_image_url: exhibitorData.business_license_image_url || '',
    vehicle_inspection_image_url: exhibitorData.vehicle_inspection_image_url || '',
    automobile_inspection_image_url: exhibitorData.automobile_inspection_image_url || '',
    pl_insurance_image_url: exhibitorData.pl_insurance_image_url || '',
    fire_equipment_layout_image_url: exhibitorData.fire_equipment_layout_image_url || '',
  })

  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (field: string, url: string) => {
    setImageUrls(prev => ({
      ...prev,
      [field]: url
    }))
  }

  const handleImageDelete = (field: string) => {
    setImageUrls(prev => ({
      ...prev,
      [field]: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // バリデーション
      if (!formData.name.trim()) {
        alert('お名前を入力してください')
        return
      }
      if (!formData.gender) {
        alert('性別を選択してください')
        return
      }
      if (!formData.age || formData.age < 0 || formData.age > 99) {
        alert('年齢を正しく入力してください（0-99歳）')
        return
      }
      if (!formData.phone_number.trim()) {
        alert('電話番号を入力してください')
        return
      }
      if (!formData.email.trim()) {
        alert('メールアドレスを入力してください')
        return
      }

      // 更新データの準備
      const updateData = {
        ...formData,
        age: parseInt(formData.age),
        business_license_image_url: imageUrls.business_license_image_url || null,
        vehicle_inspection_image_url: imageUrls.vehicle_inspection_image_url || null,
        automobile_inspection_image_url: imageUrls.automobile_inspection_image_url || null,
        pl_insurance_image_url: imageUrls.pl_insurance_image_url || null,
        fire_equipment_layout_image_url: imageUrls.fire_equipment_layout_image_url || null,
        updated_at: new Date().toISOString()
      }

      // Supabaseで更新
      const { data, error } = await supabase
        .from('exhibitors')
        .update(updateData)
        .eq('line_user_id', userProfile.userId)
        .select()
        .single()

      if (error) {
        console.error('Update failed:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        let errorMessage = '不明なエラー'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          const errorObj = error as any
          if (errorObj.message) {
            errorMessage = String(errorObj.message)
          } else if (errorObj.details) {
            errorMessage = String(errorObj.details)
          } else if (errorObj.hint) {
            errorMessage = String(errorObj.hint)
          }
        }
        
        alert(`登録情報の更新に失敗しました。エラー: ${errorMessage}`)
        return
      }

      console.log('Update successful:', data)
      alert('登録情報を更新しました')
      onUpdateComplete(data)
    } catch (error) {
      console.error('Update failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      let errorMessage = '不明なエラー'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any
        if (errorObj.message) {
          errorMessage = String(errorObj.message)
        } else if (errorObj.details) {
          errorMessage = String(errorObj.details)
        } else if (errorObj.hint) {
          errorMessage = String(errorObj.hint)
        } else {
          errorMessage = JSON.stringify(error)
        }
      }
      
      alert(`登録情報の更新に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onCancel}
            className="text-blue-500 hover:text-blue-600 flex items-center"
          >
            ← キャンセル
          </button>
          <h1 className="text-2xl font-bold text-gray-800">登録情報編集</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別 <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">選択してください</option>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年齢 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="0"
                max="99"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ジャンル
              </label>
              <select
                name="genre_category"
                value={formData.genre_category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="飲食">飲食</option>
                <option value="物販">物販</option>
                <option value="サービス">サービス</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ジャンル（自由回答）
              </label>
              <textarea
                name="genre_free_text"
                value={formData.genre_free_text}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ジャンルの詳細を入力してください"
              />
            </div>

            {/* 画像アップロード */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                登録書類
              </label>
              <div className="space-y-4">
                <ImageUpload
                  label="営業許可証"
                  documentType="business_license"
                  userId={userProfile.userId}
                  currentImageUrl={imageUrls.business_license_image_url}
                  onUploadComplete={(url) => handleImageUpload('business_license_image_url', url)}
                  onUploadError={(error) => alert(error)}
                  onImageDelete={() => handleImageDelete('business_license_image_url')}
                />

                <ImageUpload
                  label="車検証"
                  documentType="vehicle_inspection"
                  userId={userProfile.userId}
                  currentImageUrl={imageUrls.vehicle_inspection_image_url}
                  onUploadComplete={(url) => handleImageUpload('vehicle_inspection_image_url', url)}
                  onUploadError={(error) => alert(error)}
                  onImageDelete={() => handleImageDelete('vehicle_inspection_image_url')}
                />

                <ImageUpload
                  label="自動車検査証"
                  documentType="automobile_inspection"
                  userId={userProfile.userId}
                  currentImageUrl={imageUrls.automobile_inspection_image_url}
                  onUploadComplete={(url) => handleImageUpload('automobile_inspection_image_url', url)}
                  onUploadError={(error) => alert(error)}
                  onImageDelete={() => handleImageDelete('automobile_inspection_image_url')}
                />

                <ImageUpload
                  label="PL保険"
                  documentType="pl_insurance"
                  userId={userProfile.userId}
                  currentImageUrl={imageUrls.pl_insurance_image_url}
                  onUploadComplete={(url) => handleImageUpload('pl_insurance_image_url', url)}
                  onUploadError={(error) => alert(error)}
                  onImageDelete={() => handleImageDelete('pl_insurance_image_url')}
                />

                <ImageUpload
                  label="火器類配置図"
                  documentType="fire_equipment_layout"
                  userId={userProfile.userId}
                  currentImageUrl={imageUrls.fire_equipment_layout_image_url}
                  onUploadComplete={(url) => handleImageUpload('fire_equipment_layout_image_url', url)}
                  onUploadError={(error) => alert(error)}
                  onImageDelete={() => handleImageDelete('fire_equipment_layout_image_url')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
