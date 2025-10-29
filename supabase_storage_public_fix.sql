-- Supabase Storage設定修正
-- 出店者書類バケットを公開に変更

-- 1. 既存のバケットを削除
DELETE FROM storage.buckets WHERE id = 'exhibitor-documents';
DELETE FROM storage.buckets WHERE id = 'event-images';

-- 2. 出店者用書類バケットを作成（公開に変更）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibitor-documents',
  'exhibitor-documents',
  true, -- 公開に変更
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

-- 4. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to upload exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete event images" ON storage.objects;

-- 5. 出店者用書類バケットのRLSポリシー（公開アクセス許可）
CREATE POLICY "Allow public insert on exhibitor documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'exhibitor-documents');

CREATE POLICY "Allow public select on exhibitor documents" ON storage.objects
FOR SELECT USING (bucket_id = 'exhibitor-documents');

CREATE POLICY "Allow public update on exhibitor documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'exhibitor-documents');

CREATE POLICY "Allow public delete on exhibitor documents" ON storage.objects
FOR DELETE USING (bucket_id = 'exhibitor-documents');

-- 6. イベント画像バケットのRLSポリシー
CREATE POLICY "Allow public insert on event images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Allow public select on event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Allow public update on event images" ON storage.objects
FOR UPDATE USING (bucket_id = 'event-images');

CREATE POLICY "Allow public delete on event images" ON storage.objects
FOR DELETE USING (bucket_id = 'event-images');
