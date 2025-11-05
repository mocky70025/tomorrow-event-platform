'use client'

import { useState, useRef } from 'react'
import { uploadExhibitorDocument, getPublicUrl } from '@/lib/storage'

interface ImageUploadProps {
  label: string
  documentType: string
  userId: string
  onUploadComplete: (url: string) => void
  onUploadError: (error: string) => void
  onImageDelete?: () => void
  currentImageUrl?: string
  hasError?: boolean
}

export default function ImageUpload({
  label,
  documentType,
  userId,
  onUploadComplete,
  onUploadError,
  onImageDelete,
  currentImageUrl,
  hasError = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 許可する画像形式
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      onUploadError('ファイルサイズは5MB以下にしてください。')
      return
    }

    // ファイル形式チェック
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      onUploadError('対応していない画像形式です。JPEG, PNG, GIF, WebP, HEIC形式を選択してください。')
      return
    }

    // プレビュー表示
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // アップロード実行
    setUploading(true)
    try {
      const result = await uploadExhibitorDocument(file, documentType, userId)
      
      if (result.error) {
        onUploadError(`アップロードに失敗しました: ${result.error.message}`)
        setPreviewUrl(null)
      } else if (result.data) {
        const publicUrl = getPublicUrl('exhibitor-documents', result.data.path)
        setPreviewUrl(publicUrl)
        onUploadComplete(publicUrl)
      }
    } catch (error) {
      onUploadError('アップロード中にエラーが発生しました。')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // 親コンポーネントに削除を通知
    if (onImageDelete) {
      onImageDelete()
    }
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '120%',
        color: '#000000',
        marginBottom: '10px',
        display: 'block'
      }}>
        {label}
      </label>
      
      {previewUrl ? (
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
            borderRadius: '8px',
            position: 'relative'
          }}>
            <img
              src={previewUrl}
              alt={label}
              style={{
                width: '326px',
                height: '196px',
                objectFit: 'contain',
                borderRadius: '6px'
              }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                left: '311px',
                top: '-5px',
                background: '#FF3B30',
                borderRadius: '12px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1
              }}
              title="画像を削除"
            >
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: '120%',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center'
              }}>×</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '330px', height: '200px' }}>
          <div
            style={{
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
              border: hasError ? '2px dashed #FF3B30' : '2px dashed #E5E5E5',
              borderRadius: '8px',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
              id={`file-${documentType}`}
            />
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '32px',
              color: '#D9D9D9',
              marginBottom: '8px'
            }}>+</div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#6B6B6B'
            }}>画像を選択</div>
          </div>
          {hasError && (
            <div style={{
              position: 'absolute',
              width: '24px',
              height: '24px',
              left: '311px',
              top: '-5px',
              background: '#FF3B30',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: '120%',
                color: '#FFFFFF'
              }}>×</span>
            </div>
          )}
        </div>
      )}
      
      {!previewUrl && (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#6B6B6B',
          marginTop: '8px'
        }}>
          対応形式: JPEG, PNG, GIF, WebP, HEIC（最大5MB）
        </p>
      )}
    </div>
  )
}
