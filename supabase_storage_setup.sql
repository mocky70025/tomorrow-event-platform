-- Supabase Storage設定
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 既存のバケットを削除（存在する場合）
DELETE FROM storage.buckets WHERE id = 'exhibitor-documents';
DELETE FROM storage.buckets WHERE id = 'event-images';

-- 2. 出店者用書類バケットを作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibitor-documents',
  'exhibitor-documents',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 3. イベント画像バケットを作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true, -- イベント画像は公開
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 4. 出店者用書類バケットのRLSポリシー
CREATE POLICY "Allow authenticated users to upload exhibitor documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'exhibitor-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to view their own exhibitor documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'exhibitor-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own exhibitor documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'exhibitor-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own exhibitor documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'exhibitor-documents' 
  AND auth.role() = 'authenticated'
);

-- 5. イベント画像バケットのRLSポリシー
CREATE POLICY "Allow authenticated users to upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public to view event images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-images'
);

CREATE POLICY "Allow authenticated users to update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);
