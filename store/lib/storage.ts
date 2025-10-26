import { supabase } from './supabase'

export interface UploadResult {
  data: { path: string } | null
  error: Error | null
}

// 出店者用書類のアップロード
export const uploadExhibitorDocument = async (
  file: File,
  documentType: string,
  userId: string
): Promise<UploadResult> => {
  try {
    // ファイル名を生成（ユニークにするためタイムスタンプを追加）
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('exhibitor-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Upload failed:', error)
    return { data: null, error: error as Error }
  }
}

// イベント画像のアップロード
export const uploadEventImage = async (
  file: File,
  eventId: string,
  imageType: 'main' | 'additional',
  imageIndex?: number
): Promise<UploadResult> => {
  try {
    const fileExt = file.name.split('.').pop()
    let fileName: string
    
    if (imageType === 'main') {
      fileName = `${eventId}/main_${Date.now()}.${fileExt}`
    } else {
      fileName = `${eventId}/additional_${imageIndex}_${Date.now()}.${fileExt}`
    }
    
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Upload failed:', error)
    return { data: null, error: error as Error }
  }
}

// 画像の公開URLを取得
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// ファイル削除
export const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete failed:', error)
    return false
  }
}
