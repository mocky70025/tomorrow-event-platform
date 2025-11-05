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
  const [termsAccepted, setTermsAccepted] = useState(false)

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

  // フォームフィールドの共通スタイル（Figmaデザインに基づく）
  const formFieldStyle = (hasError: boolean) => ({
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: '12px 16px',
    gap: '10px',
    width: '100%',
    height: '48px',
    background: '#FFFFFF',
    border: hasError ? '1px solid #FF3B30' : '1px solid #E5E5E5',
    borderRadius: '8px'
  })

  const labelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '120%',
    color: '#000000',
    marginBottom: '10px',
    display: 'block' as const
  }

  const inputStyle = (hasValue: boolean) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    color: hasValue ? '#000000' : '#6B6B6B',
    border: 'none',
    outline: 'none',
    width: '100%',
    background: 'transparent'
  })

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
    if (!termsAccepted) newErrors.termsAccepted = true

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
    <div className="flex items-center justify-center" style={{ marginBottom: '32px' }}>
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
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <ProgressIndicator />
        
        <h2 style={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: '120%',
          color: '#000000',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          情報登録をしてください
        </h2>
        
        <div style={{
          background: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            {/* 名前 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>名前</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.name), width: '100%' }}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: false })
                    }}
                    placeholder="例) 山田太郎"
                    style={inputStyle(!!formData.name)}
                  />
                </div>
              </div>
              {errors.name && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 性別 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>性別</label>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                {(['男性', '女性', 'その他'] as const).map((option) => {
                  const value = option === '男性' ? '男' : option === '女性' ? '女' : 'それ以外'
                  return (
                    <label key={option} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={formData.gender === value}
                        onChange={(e) => {
                          setFormData({ ...formData, gender: e.target.value as any })
                          if (errors.gender) setErrors({ ...errors, gender: false })
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '1px solid #E5E5E5',
                          accentColor: formData.gender === value ? '#06C755' : undefined
                        }}
                      />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#111111' }}>{option}</span>
                    </label>
                  )
                })}
              </div>
              {errors.gender && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 年齢 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>年齢</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.age), width: '100%' }}>
                  <select
                    value={formData.age || ''}
                    onChange={(e) => {
                      const age = parseInt(e.target.value) || 0
                      setFormData({ ...formData, age })
                      if (errors.age) setErrors({ ...errors, age: false })
                    }}
                    style={inputStyle(formData.age > 0)}
                  >
                    <option value="">選択してください</option>
                    {Array.from({ length: 101 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
              {errors.age && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 電話番号 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>電話番号</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.phone_number), width: '100%' }}>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => {
                      setFormData({ ...formData, phone_number: e.target.value })
                      if (errors.phone_number) setErrors({ ...errors, phone_number: false })
                    }}
                    placeholder="例)01234567890"
                    style={inputStyle(!!formData.phone_number)}
                  />
                </div>
              </div>
              {errors.phone_number && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* メールアドレス */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>メールアドレス</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.email), width: '100%' }}>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: false })
                    }}
                    placeholder="例)kitchencar@gmail.com"
                    style={inputStyle(!!formData.email)}
                  />
                </div>
              </div>
              {errors.email && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* ジャンル */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>ジャンル</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.genre_category), width: '100%' }}>
                  <select
                    value={formData.genre_category}
                    onChange={(e) => {
                      setFormData({ ...formData, genre_category: e.target.value })
                      if (errors.genre_category) setErrors({ ...errors, genre_category: false })
                    }}
                    style={inputStyle(!!formData.genre_category)}
                  >
                    <option value="">選択してください</option>
                    <option value="飲食">飲食</option>
                    <option value="物販">物販</option>
                    <option value="サービス">サービス</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>
              {errors.genre_category && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* より詳しいジャンル */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }}>
              <label style={labelStyle}>より詳しいジャンル</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.genre_free_text), width: '100%' }}>
                  <input
                    type="text"
                    value={formData.genre_free_text}
                    onChange={(e) => {
                      setFormData({ ...formData, genre_free_text: e.target.value })
                      if (errors.genre_free_text) setErrors({ ...errors, genre_free_text: false })
                    }}
                    placeholder="例) カレーライス、飲み物"
                    style={inputStyle(!!formData.genre_free_text)}
                  />
                </div>
              </div>
              {errors.genre_free_text && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>
          </div>
        </div>

        {/* 書類アップロード */}
        <div style={{
          background: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
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
        <div style={{ marginBottom: '24px', width: '100%', maxWidth: '330px', marginLeft: 'auto', marginRight: 'auto' }}>
          <label style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              background: termsAccepted ? '#06C755' : '#FFFFFF',
              border: termsAccepted ? 'none' : '1px solid #E5E5E5',
              borderRadius: '4px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              setTermsAccepted(!termsAccepted)
              if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: false })
            }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked)
                  if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: false })
                }}
                style={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              {termsAccepted && (
                <svg style={{
                  width: '11px',
                  height: '9px',
                  color: '#FFFFFF'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: termsAccepted ? '#06C755' : '#000000'
            }}>利用規約に同意する</span>
          </label>
          {errors.termsAccepted && (
            <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>利用規約への同意が必要です</p>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!termsAccepted}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px 24px',
            gap: '10px',
            width: '100%',
            maxWidth: '330px',
            height: '48px',
            background: termsAccepted ? '#06C755' : '#D9D9D9',
            borderRadius: '8px',
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: '19px',
            color: '#FFFFFF',
            cursor: termsAccepted ? 'pointer' : 'not-allowed',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          次に進む
        </button>
      </div>
    </div>
  )

  // ステップ2: 情報確認
  const renderStep2 = () => (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <ProgressIndicator />
        
        <h2 style={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: '120%',
          color: '#000000',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          情報確認をしてください
        </h2>
        
        <div style={{
          background: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>名前</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>{formData.name}</p>
            </div>
            <div>
              <label style={labelStyle}>性別</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>
                {formData.gender === '男' ? '男性' : formData.gender === '女' ? '女性' : formData.gender === 'それ以外' ? 'その他' : ''}
              </p>
            </div>
            <div>
              <label style={labelStyle}>年齢</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>{formData.age}</p>
            </div>
            <div>
              <label style={labelStyle}>電話番号</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>{formData.phone_number}</p>
            </div>
            <div>
              <label style={labelStyle}>メールアドレス</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>{formData.email}</p>
            </div>
            <div>
              <label style={labelStyle}>ジャンル</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>{formData.genre_category}</p>
            </div>
            <div>
              <label style={labelStyle}>より詳しいジャンル</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>{formData.genre_free_text}</p>
            </div>
          </div>
        </div>

        {/* 書類画像プレビュー */}
        <div style={{
          background: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {documentUrls.business_license && (
              <div>
                <label style={labelStyle}>営業許可証</label>
                <div style={{ position: 'relative', width: '330px', height: '200px' }}>
                  <div style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '32px 99px',
                    gap: '10px',
                    width: '330px',
                    height: '200px',
                    background: '#F7F7F7',
                    border: '2px solid #06C755',
                    borderRadius: '8px'
                  }}>
                    <img
                      src={documentUrls.business_license}
                      alt="営業許可証"
                      style={{
                        width: '326px',
                        height: '196px',
                        objectFit: 'contain',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {documentUrls.vehicle_inspection && (
              <div>
                <label style={labelStyle}>車検証</label>
                <div style={{ position: 'relative', width: '330px', height: '200px' }}>
                  <div style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '32px 99px',
                    gap: '10px',
                    width: '330px',
                    height: '200px',
                    background: '#F7F7F7',
                    border: '2px solid #06C755',
                    borderRadius: '8px'
                  }}>
                    <img
                      src={documentUrls.vehicle_inspection}
                      alt="車検証"
                      style={{
                        width: '326px',
                        height: '196px',
                        objectFit: 'contain',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {documentUrls.automobile_inspection && (
              <div>
                <label style={labelStyle}>自動車検査証</label>
                <div style={{ position: 'relative', width: '330px', height: '200px' }}>
                  <div style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '32px 99px',
                    gap: '10px',
                    width: '330px',
                    height: '200px',
                    background: '#F7F7F7',
                    border: '2px solid #06C755',
                    borderRadius: '8px'
                  }}>
                    <img
                      src={documentUrls.automobile_inspection}
                      alt="自動車検査証"
                      style={{
                        width: '326px',
                        height: '196px',
                        objectFit: 'contain',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {documentUrls.fire_equipment_layout && (
              <div>
                <label style={labelStyle}>火器類配置図</label>
                <div style={{ position: 'relative', width: '330px', height: '200px' }}>
                  <div style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '32px 99px',
                    gap: '10px',
                    width: '330px',
                    height: '200px',
                    background: '#F7F7F7',
                    border: '2px solid #06C755',
                    borderRadius: '8px'
                  }}>
                    <img
                      src={documentUrls.fire_equipment_layout}
                      alt="火器類配置図"
                      style={{
                        width: '326px',
                        height: '196px',
                        objectFit: 'contain',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {documentUrls.pl_insurance && (
              <div>
                <label style={labelStyle}>PL保険登録証</label>
                <div style={{ position: 'relative', width: '330px', height: '200px' }}>
                  <div style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '32px 99px',
                    gap: '10px',
                    width: '330px',
                    height: '200px',
                    background: '#F7F7F7',
                    border: '2px solid #06C755',
                    borderRadius: '8px'
                  }}>
                    <img
                      src={documentUrls.pl_insurance}
                      alt="PL保険登録証"
                      style={{
                        width: '326px',
                        height: '196px',
                        objectFit: 'contain',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 利用規約 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              background: '#06C755',
              borderRadius: '4px',
              position: 'relative'
            }}>
              <input
                type="checkbox"
                checked
                readOnly
                style={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <svg style={{
                position: 'absolute',
                width: '11px',
                height: '9px',
                left: '4px',
                top: '5px',
                color: '#FFFFFF'
              }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#06C755'
            }}>利用規約に同意する</span>
          </label>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 24px',
              gap: '10px',
              height: '48px',
              background: '#FFFFFF',
              border: '2px solid #06C755',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#06C755',
              cursor: 'pointer'
            }}
          >
            修正する
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 24px',
              gap: '10px',
              height: '48px',
              background: loading ? '#D9D9D9' : '#06C755',
              borderRadius: '8px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </div>
      </div>
    </div>
  )

  // ステップ3: 登録完了
  const renderStep3 = () => (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <ProgressIndicator />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{
            width: '96px',
            height: '96px',
            background: '#06C755',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg style={{ width: '64px', height: '64px', color: '#FFFFFF' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            marginBottom: '32px'
          }}>
            登録完了
          </h2>
          
          <button
            onClick={onRegistrationComplete}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 24px',
              gap: '10px',
              height: '48px',
              background: '#06C755',
              borderRadius: '8px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
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
