'use client'

import { useState } from 'react'
import { supabase, type Exhibitor } from '@/lib/supabase'
import ImageUpload from './ImageUpload'

interface RegistrationFormProps {
  userProfile: any
  onRegistrationComplete: () => void
}

type Step = 1 | 2 | 3

export default function RegistrationForm({ userProfile, onRegistrationComplete }: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    name: '',
    gender: '' as '' | '男' | '女' | 'それ以外',
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

  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  // 全角数字を半角に変換
  const convertToHalfWidth = (str: string): string => {
    return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
  }

  // 電話番号のバリデーション（全角/半角数字を認識、ハイフンなし）
  const validatePhoneNumber = (phone: string): boolean => {
    const halfWidth = convertToHalfWidth(phone.replace(/-/g, ''))
    return /^\d+$/.test(halfWidth) && halfWidth.length >= 10 && halfWidth.length <= 15
  }

  // メールアドレスのバリデーション
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 年齢のバリデーション
  const validateAge = (age: number): boolean => {
    return age >= 0 && age <= 100
  }

  // バリデーション実行
  const validateForm = (): boolean => {
    const newErrors: Record<string, boolean> = {}

    if (!formData.name.trim()) newErrors.name = true
    if (!formData.gender) newErrors.gender = true
    if (!validateAge(formData.age)) newErrors.age = true
    if (!validatePhoneNumber(formData.phone_number)) newErrors.phone_number = true
    if (!validateEmail(formData.email)) newErrors.email = true
    if (!formData.genre_category) newErrors.genre_category = true
    if (!formData.genre_free_text.trim()) newErrors.genre_free_text = true
    if (!documentUrls.business_license) newErrors.business_license = true
    if (!documentUrls.vehicle_inspection) newErrors.vehicle_inspection = true
    if (!documentUrls.automobile_inspection) newErrors.automobile_inspection = true
    if (!documentUrls.pl_insurance) newErrors.pl_insurance = true
    if (!documentUrls.fire_equipment_layout) newErrors.fire_equipment_layout = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleSubmit = async () => {
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
        setLoading(false)
        return
      }

      // 電話番号を半角に変換（ハイフン削除）
      const normalizedPhone = convertToHalfWidth(formData.phone_number.replace(/-/g, ''))

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
          phone_number: normalizedPhone,
          ...documentImageUrls,
          line_user_id: userProfile.userId,
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setCurrentStep(3)
    } catch (error) {
      console.error('Registration failed:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`登録に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // 進捗インジケーター（Figmaデザインに基づく）
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="relative" style={{ width: '250.5px', height: '16px' }}>
        {/* ステップ1の円 */}
        <div 
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: '16px',
            height: '16px',
            left: '0px',
            top: '0px',
            backgroundColor: currentStep >= 1 ? '#06C755' : 'transparent',
            border: currentStep >= 1 ? 'none' : '1px solid #06C755',
          }}
        >
          {currentStep > 1 && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        {/* 線1（ステップ1と2の間） */}
        <div 
          className="absolute"
          style={{
            width: '101.75px',
            height: '4px',
            left: '15.75px',
            top: '6px',
            backgroundColor: currentStep >= 2 ? '#06C755' : '#D9D9D9',
          }}
        />
        
        {/* ステップ2の円 */}
        <div 
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: '16px',
            height: '16px',
            left: '117px',
            top: '0px',
            backgroundColor: currentStep >= 2 ? '#06C755' : 'transparent',
            border: currentStep >= 2 ? 'none' : '1px solid #06C755',
          }}
        >
          {currentStep > 2 && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        {/* 線2（ステップ2と3の間） */}
        <div 
          className="absolute"
          style={{
            width: '101.75px',
            height: '4px',
            left: '133px',
            top: '6px',
            backgroundColor: currentStep >= 3 ? '#06C755' : '#D9D9D9',
          }}
        />
        
        {/* ステップ3の円 */}
        <div 
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: '16px',
            height: '16px',
            left: '234.5px',
            top: '0px',
            backgroundColor: currentStep >= 3 ? '#06C755' : 'transparent',
            border: currentStep >= 3 ? 'none' : '1px solid #06C755',
          }}
        >
          {currentStep >= 3 && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        {/* ラベル */}
        <div className="absolute top-6 left-0" style={{ width: '250.5px' }}>
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-700 whitespace-nowrap">情報登録</span>
            <span className="text-[14px] text-gray-700 whitespace-nowrap">情報確認</span>
            <span className="text-[14px] text-gray-700 whitespace-nowrap">登録完了</span>
          </div>
        </div>
      </div>
    </div>
  )

  // ステップ1: 情報登録
  const renderStep1 = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator />
        
        <h2 className="text-[20px] font-bold text-gray-800 mb-6 text-center">情報登録をしてください</h2>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            {/* 名前 */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                名前
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: false })
                }}
                placeholder="例) 山田太郎"
                className={`w-full border rounded-md px-3 py-2 text-[16px] ${
                  errors.name ? 'border-[#FF3B30]' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>

            {/* 性別 */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                性別
              </label>
              <div className="flex space-x-4">
                {(['男性', '女性', 'その他'] as const).map((option) => {
                  const value = option === '男性' ? '男' : option === '女性' ? '女' : 'それ以外'
                  return (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={formData.gender === value}
                        onChange={(e) => {
                          setFormData({ ...formData, gender: e.target.value as any })
                          if (errors.gender) setErrors({ ...errors, gender: false })
                        }}
                        className="w-4 h-4 text-[#06C755] focus:ring-[#06C755]"
                      />
                      <span className="ml-2 text-[16px] text-gray-700">{option}</span>
                    </label>
                  )
                })}
              </div>
              {errors.gender && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>

            {/* 年齢 */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                年齢
              </label>
              <select
                value={formData.age || ''}
                onChange={(e) => {
                  const age = parseInt(e.target.value) || 0
                  setFormData({ ...formData, age })
                  if (errors.age) setErrors({ ...errors, age: false })
                }}
                className={`w-full border rounded-md px-3 py-2 text-[16px] ${
                  errors.age ? 'border-[#FF3B30]' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {Array.from({ length: 101 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              {errors.age && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>

            {/* 電話番号 */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => {
                  setFormData({ ...formData, phone_number: e.target.value })
                  if (errors.phone_number) setErrors({ ...errors, phone_number: false })
                }}
                placeholder="例)01234567890"
                className={`w-full border rounded-md px-3 py-2 text-[16px] ${
                  errors.phone_number ? 'border-[#FF3B30]' : 'border-gray-300'
                }`}
              />
              {errors.phone_number && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) setErrors({ ...errors, email: false })
                }}
                placeholder="例)kitchencar@gmail.com"
                className={`w-full border rounded-md px-3 py-2 text-[16px] ${
                  errors.email ? 'border-[#FF3B30]' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>

            {/* ジャンル */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                ジャンル
              </label>
              <select
                value={formData.genre_category}
                onChange={(e) => {
                  setFormData({ ...formData, genre_category: e.target.value })
                  if (errors.genre_category) setErrors({ ...errors, genre_category: false })
                }}
                className={`w-full border rounded-md px-3 py-2 text-[16px] ${
                  errors.genre_category ? 'border-[#FF3B30]' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                <option value="飲食">飲食</option>
                <option value="物販">物販</option>
                <option value="サービス">サービス</option>
                <option value="その他">その他</option>
              </select>
              {errors.genre_category && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>

            {/* より詳しいジャンル */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                より詳しいジャンル
              </label>
              <input
                type="text"
                value={formData.genre_free_text}
                onChange={(e) => {
                  setFormData({ ...formData, genre_free_text: e.target.value })
                  if (errors.genre_free_text) setErrors({ ...errors, genre_free_text: false })
                }}
                placeholder="例) カレーライス、飲み物"
                className={`w-full border rounded-md px-3 py-2 text-[16px] ${
                  errors.genre_free_text ? 'border-[#FF3B30]' : 'border-gray-300'
                }`}
              />
              {errors.genre_free_text && (
                <p className="text-[12px] text-[#FF3B30] mt-1">入力してください</p>
              )}
            </div>
          </div>
        </div>

        {/* 書類アップロード */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-6">
            <ImageUpload
              label="営業許可証"
              documentType="business_license"
              userId={userProfile.userId}
              onUploadComplete={(url) => {
                setDocumentUrls(prev => ({ ...prev, business_license: url }))
                if (errors.business_license) setErrors({ ...errors, business_license: false })
              }}
              onUploadError={(error) => alert(error)}
              hasError={errors.business_license}
            />
            
            <ImageUpload
              label="車検証"
              documentType="vehicle_inspection"
              userId={userProfile.userId}
              onUploadComplete={(url) => {
                setDocumentUrls(prev => ({ ...prev, vehicle_inspection: url }))
                if (errors.vehicle_inspection) setErrors({ ...errors, vehicle_inspection: false })
              }}
              onUploadError={(error) => alert(error)}
              hasError={errors.vehicle_inspection}
            />
            
            <ImageUpload
              label="自動車検査証"
              documentType="automobile_inspection"
              userId={userProfile.userId}
              onUploadComplete={(url) => {
                setDocumentUrls(prev => ({ ...prev, automobile_inspection: url }))
                if (errors.automobile_inspection) setErrors({ ...errors, automobile_inspection: false })
              }}
              onUploadError={(error) => alert(error)}
              hasError={errors.automobile_inspection}
            />
            
            <ImageUpload
              label="火器類配置図"
              documentType="fire_equipment_layout"
              userId={userProfile.userId}
              onUploadComplete={(url) => {
                setDocumentUrls(prev => ({ ...prev, fire_equipment_layout: url }))
                if (errors.fire_equipment_layout) setErrors({ ...errors, fire_equipment_layout: false })
              }}
              onUploadError={(error) => alert(error)}
              hasError={errors.fire_equipment_layout}
            />
            
            <ImageUpload
              label="PL保険登録証"
              documentType="pl_insurance"
              userId={userProfile.userId}
              onUploadComplete={(url) => {
                setDocumentUrls(prev => ({ ...prev, pl_insurance: url }))
                if (errors.pl_insurance) setErrors({ ...errors, pl_insurance: false })
              }}
              onUploadError={(error) => alert(error)}
              hasError={errors.pl_insurance}
            />
          </div>
        </div>

        {/* 利用規約とボタン */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-[#06C755] focus:ring-[#06C755] rounded"
            />
            <span className="ml-2 text-[16px] text-gray-700">利用規約に同意する</span>
          </label>
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-[#06C755] hover:bg-[#05B048] text-white font-bold py-3 px-6 rounded-lg text-[16px] transition-colors"
        >
          次に進む
        </button>
      </div>
    </div>
  )

  // ステップ2: 情報確認
  const renderStep2 = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator />
        
        <h2 className="text-[20px] font-bold text-gray-800 mb-6 text-center">情報確認をしてください</h2>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">名前</label>
              <p className="text-[16px] text-gray-800">{formData.name}</p>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">性別</label>
              <p className="text-[16px] text-gray-800">
                {formData.gender === '男' ? '男性' : formData.gender === '女' ? '女性' : formData.gender === 'それ以外' ? 'その他' : ''}
              </p>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">年齢</label>
              <p className="text-[16px] text-gray-800">{formData.age}</p>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">電話番号</label>
              <p className="text-[16px] text-gray-800">{formData.phone_number}</p>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">メールアドレス</label>
              <p className="text-[16px] text-gray-800">{formData.email}</p>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">ジャンル</label>
              <p className="text-[16px] text-gray-800">{formData.genre_category}</p>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">より詳しいジャンル</label>
              <p className="text-[16px] text-gray-800">{formData.genre_free_text}</p>
            </div>
          </div>
        </div>

        {/* 書類画像プレビュー */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-6">
            {documentUrls.business_license && (
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">営業許可証</label>
                <img
                  src={documentUrls.business_license}
                  alt="営業許可証"
                  className="w-full h-64 object-contain rounded-lg border-2 border-[#06C755] bg-gray-50"
                />
              </div>
            )}
            {documentUrls.vehicle_inspection && (
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">車検証</label>
                <img
                  src={documentUrls.vehicle_inspection}
                  alt="車検証"
                  className="w-full h-64 object-contain rounded-lg border-2 border-[#06C755] bg-gray-50"
                />
              </div>
            )}
            {documentUrls.automobile_inspection && (
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">自動車検査証</label>
                <img
                  src={documentUrls.automobile_inspection}
                  alt="自動車検査証"
                  className="w-full h-64 object-contain rounded-lg border-2 border-[#06C755] bg-gray-50"
                />
              </div>
            )}
            {documentUrls.fire_equipment_layout && (
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">火器類配置図</label>
                <img
                  src={documentUrls.fire_equipment_layout}
                  alt="火器類配置図"
                  className="w-full h-64 object-contain rounded-lg border-2 border-[#06C755] bg-gray-50"
                />
              </div>
            )}
            {documentUrls.pl_insurance && (
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">PL保険登録証</label>
                <img
                  src={documentUrls.pl_insurance}
                  alt="PL保険登録証"
                  className="w-full h-64 object-contain rounded-lg border-2 border-[#06C755] bg-gray-50"
                />
              </div>
            )}
          </div>
        </div>

        {/* 利用規約 */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked
              readOnly
              className="w-4 h-4 text-[#06C755] focus:ring-[#06C755] rounded"
            />
            <span className="ml-2 text-[16px] text-gray-700">利用規約に同意する</span>
          </label>
        </div>

        {/* ボタン */}
        <div className="flex space-x-4">
          <button
            onClick={handleBack}
            className="flex-1 border-2 border-[#06C755] text-[#06C755] font-bold py-3 px-6 rounded-lg text-[16px] bg-white hover:bg-gray-50 transition-colors"
          >
            修正する
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#06C755] hover:bg-[#05B048] text-white font-bold py-3 px-6 rounded-lg text-[16px] transition-colors disabled:bg-gray-400"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </div>
      </div>
    </div>
  )

  // ステップ3: 登録完了
  const renderStep3 = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator />
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24 bg-[#06C755] rounded-lg flex items-center justify-center mb-6">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-[24px] font-bold text-gray-800 mb-8">登録完了</h2>
          
          <button
            onClick={onRegistrationComplete}
            className="w-full bg-[#06C755] hover:bg-[#05B048] text-white font-bold py-3 px-6 rounded-lg text-[16px] transition-colors"
          >
            マイページへ
          </button>
        </div>
      </div>
    </div>
  )

  if (currentStep === 1) return renderStep1()
  if (currentStep === 2) return renderStep2()
  if (currentStep === 3) return renderStep3()
  
  return null
}
