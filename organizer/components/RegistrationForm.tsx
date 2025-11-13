'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, type OrganizerProfile, type OrganizerMember } from '@/lib/supabase'

interface RegistrationFormProps {
  userProfile: any
  onRegistrationComplete: (profile: OrganizerProfile, member: OrganizerMember) => void
}

interface OrganizerFormState {
  company_name: string
  name: string
  gender: '' | '男' | '女' | 'それ以外'
  age: number
  phone_number: string
  email: string
}

interface OrganizerDraftPayload {
  formData: OrganizerFormState
  termsAccepted: boolean
  hasViewedTerms: boolean
}

const SAVE_DEBOUNCE_MS = 800
const ORGANIZER_DRAFT_TYPE = 'organizer_registration'

const ORGANIZER_FORM_INITIAL: OrganizerFormState = {
  company_name: '',
  name: '',
  gender: '',
  age: 0,
  phone_number: '',
  email: '',
}

const hasOrganizerDraftContent = (payload: OrganizerDraftPayload): boolean => {
  const hasFormValue = Object.values(payload.formData).some((value) => {
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'number') return value > 0
    return false
  })

  if (hasFormValue) return true
  if (payload.termsAccepted || payload.hasViewedTerms) return true

  return false
}

export default function RegistrationForm({ userProfile, onRegistrationComplete }: RegistrationFormProps) {
  const [formData, setFormData] = useState<OrganizerFormState>({ ...ORGANIZER_FORM_INITIAL })

  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsPage, setShowTermsPage] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [hasViewedTerms, setHasViewedTerms] = useState(false)
  const [currentStep] = useState<1 | 2 | 3>(1) // 主催者は常にステップ1
  const [draftLoaded, setDraftLoaded] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPayloadRef = useRef<string>('')
  const draftExistsRef = useRef(false)

  const upsertDraft = useCallback(
    async (payload: OrganizerDraftPayload) => {
      if (!userProfile?.userId) return
      const { error } = await supabase
        .from('form_drafts')
        .upsert(
          {
            user_id: userProfile.userId,
            form_type: ORGANIZER_DRAFT_TYPE,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, form_type' }
        )

      if (error) throw error
      draftExistsRef.current = true
    },
    [userProfile?.userId]
  )

  const removeDraft = useCallback(async () => {
    if (!userProfile?.userId || !draftExistsRef.current) return
    const { error } = await supabase
      .from('form_drafts')
      .delete()
      .eq('user_id', userProfile.userId)
      .eq('form_type', ORGANIZER_DRAFT_TYPE)

    if (error) throw error
    draftExistsRef.current = false
  }, [userProfile?.userId])

  const scheduleDraftUpsert = useCallback(
    (payload: OrganizerDraftPayload) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        saveTimeoutRef.current = null
        try {
          await upsertDraft(payload)
        } catch (error) {
          console.error('Failed to save organizer registration draft:', error)
        }
      }, SAVE_DEBOUNCE_MS)
    },
    [upsertDraft]
  )

  const scheduleDraftDeletion = useCallback(() => {
    if (!draftExistsRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      saveTimeoutRef.current = null
      try {
        await removeDraft()
      } catch (error) {
        console.error('Failed to delete organizer registration draft:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [removeDraft])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadDraft = async () => {
      if (!userProfile?.userId) {
        if (!isCancelled) setDraftLoaded(true)
        return
      }

      try {
        const { data, error } = await supabase
          .from('form_drafts')
          .select('payload')
          .eq('user_id', userProfile.userId)
          .eq('form_type', ORGANIZER_DRAFT_TYPE)
          .limit(1)

        if (error) throw error

        const record = data?.[0]

        if (record?.payload && !isCancelled) {
          const payload = record.payload as Partial<OrganizerDraftPayload>
          const restoredFormData: OrganizerFormState = {
            ...ORGANIZER_FORM_INITIAL,
            ...(payload.formData ?? {}),
          }
          const restoredTermsAccepted = Boolean(payload.termsAccepted)
          const restoredHasViewedTerms = Boolean(payload.hasViewedTerms)

          setFormData(restoredFormData)
          setTermsAccepted(restoredTermsAccepted)
          setHasViewedTerms(restoredHasViewedTerms)

          draftExistsRef.current = true
          lastPayloadRef.current = JSON.stringify({
            formData: restoredFormData,
            termsAccepted: restoredTermsAccepted,
            hasViewedTerms: restoredHasViewedTerms,
          })
        }
      } catch (error) {
        console.error('Failed to load organizer registration draft:', error)
      } finally {
        if (!isCancelled) setDraftLoaded(true)
      }
    }

    loadDraft()

    return () => {
      isCancelled = true
    }
  }, [userProfile?.userId])

  useEffect(() => {
    if (!draftLoaded) return

    const payload: OrganizerDraftPayload = {
      formData,
      termsAccepted,
      hasViewedTerms,
    }

    if (!hasOrganizerDraftContent(payload)) {
      lastPayloadRef.current = ''
      scheduleDraftDeletion()
      return
    }

    const serializedPayload = JSON.stringify(payload)
    if (lastPayloadRef.current === serializedPayload) return

    lastPayloadRef.current = serializedPayload
    scheduleDraftUpsert(payload)
  }, [
    formData,
    termsAccepted,
    hasViewedTerms,
    draftLoaded,
    scheduleDraftUpsert,
    scheduleDraftDeletion,
  ])

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

  // フォームフィールドの共通スタイル
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

    if (!formData.company_name.trim()) newErrors.company_name = true
    if (!formData.name.trim()) newErrors.name = true
    if (!formData.gender) newErrors.gender = true
    if (!validateAge(formData.age)) newErrors.age = true
    if (!formData.phone_number.trim() || !validatePhoneNumber(formData.phone_number)) newErrors.phone_number = true
    if (!formData.email.trim() || !validateEmail(formData.email)) newErrors.email = true
    if (!termsAccepted) newErrors.termsAccepted = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 利用規約ページから戻ったときのチェック
  const handleBackFromTerms = () => {
    setShowTermsPage(false)
    setHasViewedTerms(true)
    // スクロール位置は保持
    const isValid = validateForm()
    if (!isValid) {
      setTimeout(() => {
        const firstErrorKey = Object.keys(errors).find(key => errors[key])
        if (firstErrorKey) {
          const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`)
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }, 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors).find(key => errors[key])
      if (firstErrorKey) {
        const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const inputElement = errorElement.querySelector('input, select, textarea')
          if (inputElement) {
            (inputElement as HTMLElement).focus()
          }
        }
      }
      return
    }

    setLoading(true)

    try {
      // 重複登録チェック
      const { data: existingMember, error: existingError } = await supabase
        .from('organizer_members')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existingMember) {
        alert('既に登録済みです。')
        return
      }

      // 電話番号を半角に変換（ハイフン削除）
      const normalizedPhone = convertToHalfWidth(formData.phone_number.replace(/-/g, ''))

      const { data: profileData, error: profileError } = await supabase
        .from('organizer_profiles')
        .insert({
          company_name: formData.company_name,
          is_approved: false,
          contact_phone: normalizedPhone,
          contact_email: formData.email,
        })
        .select()
        .single()

      if (profileError || !profileData) {
        throw profileError
      }

      const { data: memberData, error: memberError } = await supabase
        .from('organizer_members')
        .insert({
          organizer_profile_id: profileData.id,
          line_user_id: userProfile.userId,
          name: formData.name,
          gender: formData.gender || null,
          age: formData.age || null,
          phone_number: normalizedPhone,
          email: formData.email,
          role: 'owner',
          is_primary: true,
        })
        .select()
        .single()

      if (memberError || !memberData) {
        throw memberError
      }

      try {
        await removeDraft()
        lastPayloadRef.current = ''
        setDraftLoaded(false)
      } catch (draftError) {
        console.error('Failed to clear organizer registration draft after submit:', draftError)
      }

      alert('登録が完了しました。運営側の承認をお待ちください。')
      onRegistrationComplete(profileData, memberData)
    } catch (error) {
      console.error('Registration failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`登録に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // 進捗インジケーター（Figmaデザインに基づく）
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center" style={{ marginBottom: '48px', paddingTop: '24px' }}>
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
        <div className="absolute top-6 left-0" style={{ width: '250.5px', height: '20px' }}>
          {/* 情報登録 - 円の中心は8px（left: 0px + 円の半径8px） */}
          <span 
            className="absolute text-[14px] text-gray-700 whitespace-nowrap"
            style={{
              left: '8px',
              transform: 'translateX(-50%)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            情報登録
          </span>
          {/* 情報確認 - 円の中心は125px（left: 117px + 円の半径8px） */}
          <span 
            className="absolute text-[14px] text-gray-700 whitespace-nowrap"
            style={{
              left: '125px',
              transform: 'translateX(-50%)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            情報確認
          </span>
          {/* 登録完了 - 円の中心は242.5px（left: 234.5px + 円の半径8px） */}
          <span 
            className="absolute text-[14px] text-gray-700 whitespace-nowrap"
            style={{
              left: '242.5px',
              transform: 'translateX(-50%)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            登録完了
          </span>
        </div>
      </div>
    </div>
  )

  // 利用規約ページ
  if (showTermsPage) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
          <h2 style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            marginBottom: '24px',
            textAlign: 'center',
            paddingTop: '24px'
          }}>
            利用規約
          </h2>
          
          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '400px'
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#666666'
            }}>
              主催者向け利用規約の内容はこちらに表示されます。
            </p>
          </div>

          <button
            onClick={handleBackFromTerms}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 24px',
              gap: '10px',
              width: '100%',
              height: '48px',
              background: '#06C755',
              borderRadius: '8px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#FFFFFF',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            元のページに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
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
          marginTop: '16px',
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
            {/* 会社名 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="company_name">
              <label style={labelStyle}>会社名</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.company_name), width: '100%' }}>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => {
                      setFormData({ ...formData, company_name: e.target.value })
                      if (errors.company_name) setErrors({ ...errors, company_name: false })
                    }}
                    placeholder="株式会社サンプル"
                    style={inputStyle(!!formData.company_name)}
                  />
                </div>
              </div>
              {errors.company_name && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 名前 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="name">
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
                    placeholder="山田太郎"
                    style={inputStyle(!!formData.name)}
                  />
                </div>
              </div>
              {errors.name && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 性別 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="gender">
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
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        lineHeight: '150%',
                        color: '#000000'
                      }}>{option}</span>
                    </label>
                  )
                })}
              </div>
              {errors.gender && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 年齢 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="age">
              <label style={labelStyle}>年齢</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ ...formFieldStyle(errors.age), width: '100%' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.age || ''}
                    onChange={(e) => {
                      const ageValue = parseInt(e.target.value) || 0
                      setFormData({ ...formData, age: ageValue })
                      if (errors.age) setErrors({ ...errors, age: false })
                    }}
                    placeholder="25"
                    style={inputStyle(formData.age > 0)}
                  />
                </div>
              </div>
              {errors.age && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* 電話番号 */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="phone_number">
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
                    placeholder="01234567890"
                    style={inputStyle(!!formData.phone_number)}
                  />
                </div>
              </div>
              {errors.phone_number && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>

            {/* メールアドレス */}
            <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="email">
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
                    placeholder="kitchencar@gmail.com"
                    style={inputStyle(!!formData.email)}
                  />
                </div>
              </div>
              {errors.email && (
                <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
              )}
            </div>
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
              width: '24px',
              height: '24px',
              background: termsAccepted ? '#06C755' : '#FFFFFF',
              border: termsAccepted ? 'none' : '1px solid #E5E5E5',
              borderRadius: '8px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: hasViewedTerms ? 'pointer' : 'not-allowed',
              opacity: hasViewedTerms ? 1 : 0.5
            }}
            onClick={() => {
              if (!hasViewedTerms) {
                setShowTermsPage(true)
                return
              }
              setTermsAccepted(!termsAccepted)
              if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: false })
            }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  if (!hasViewedTerms) {
                    setShowTermsPage(true)
                    return
                  }
                  setTermsAccepted(e.target.checked)
                  if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: false })
                }}
                disabled={!hasViewedTerms}
                style={{
                  position: 'absolute',
                  width: '24px',
                  height: '24px',
                  opacity: 0,
                  cursor: hasViewedTerms ? 'pointer' : 'not-allowed'
                }}
              />
              {termsAccepted && (
                <svg style={{
                  width: '16px',
                  height: '13px',
                  color: '#FFFFFF'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                setShowTermsPage(true)
              }}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                lineHeight: '150%',
                color: '#06C755',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              利用規約
              <svg style={{
                width: '14px',
                height: '14px',
                color: '#06C755'
              }} fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#000000'
            }}>
              に同意する
            </span>
          </label>
          {errors.termsAccepted && (
            <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>利用規約への同意が必要です</p>
          )}
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading || !termsAccepted}
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
            background: termsAccepted && !loading ? '#06C755' : '#D9D9D9',
            borderRadius: '8px',
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: '19px',
            color: '#FFFFFF',
            cursor: termsAccepted && !loading ? 'pointer' : 'not-allowed',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          {loading ? '登録中...' : '登録する'}
        </button>
      </div>
    </div>
  )
}
