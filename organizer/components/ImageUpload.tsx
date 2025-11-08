'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadEventImage, getPublicUrl } from '@/lib/storage'

interface ImageUploadProps {
  label: string
  eventId: string
  imageType: 'main' | 'additional'
  imageIndex?: number
  onUploadComplete: (url: string) => void
  onUploadError: (error: string) => void
  currentImageUrl?: string
  showFormatNote?: boolean
  onImageDelete?: () => void
}

export default function ImageUpload({
  label,
  eventId,
  imageType,
  imageIndex,
  onUploadComplete,
  onUploadError,
  currentImageUrl,
  showFormatNote = true,
  onImageDelete
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null)
  }, [currentImageUrl])

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

    if (file.size > 10 * 1024 * 1024) {
      onUploadError('ファイルサイズは10MB以下にしてください。')
      return
    }

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      onUploadError('対応していない画像形式です。JPEG, PNG, GIF, WebP, HEIC形式を選択してください。')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const result = await uploadEventImage(file, eventId, imageType, imageIndex)
      if (result.error) {
        onUploadError(`アップロードに失敗しました: ${result.error.message}`)
        setPreviewUrl(null)
      } else if (result.data) {
        const publicUrl = getPublicUrl('event-images', result.data.path)
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
    if (onImageDelete) {
      onImageDelete()
    }
  }

  return (
    <div style={{ marginBottom: '24px', width: '100%', maxWidth: '330px' }}>
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
        <div style={{ position: 'relative', width: '100%', height: '200px' }}>
          <div style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px',
            gap: '10px',
            width: '100%',
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
                width: 'calc(100% - 4px)',
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
                right: '-5px',
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
        <div style={{ position: 'relative', width: '100%', height: '200px' }}>
          <div
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '32px 16px',
              gap: '10px',
              width: '100%',
              height: '200px',
              background: '#F7F7F7',
              border: '2px dashed #E5E5E5',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s ease-in-out'
            }}
            onClick={() => {
              if (!uploading) fileInputRef.current?.click()
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#06C755'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = '#E5E5E5'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
              id={`file-${imageType}-${imageIndex ?? 'main'}`}
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
            }}>
              {uploading ? 'アップロード中...' : '画像を選択'}
            </div>
          </div>
        </div>
      )}

      {showFormatNote && (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          lineHeight: '150%',
          color: '#6B6B6B',
          marginTop: '8px'
        }}>
          対応形式: JPG, PNG, GIF, WebP, HEIC（最大10MB）
        </p>
      )}
    </div>
  )
}
