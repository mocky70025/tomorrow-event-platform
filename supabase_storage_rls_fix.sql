-- Supabase Storage RLSポリシー修正
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to upload exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own exhibitor documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete event images" ON storage.objects;

-- 2. 緩和されたRLSポリシーを作成
-- 出店者用書類バケット
CREATE POLICY "Allow public upload to exhibitor-documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'exhibitor-documents');

CREATE POLICY "Allow public select from exhibitor-documents" ON storage.objects
FOR SELECT USING (bucket_id = 'exhibitor-documents');

CREATE POLICY "Allow public update to exhibitor-documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'exhibitor-documents');

CREATE POLICY "Allow public delete from exhibitor-documents" ON storage.objects
FOR DELETE USING (bucket_id = 'exhibitor-documents');

-- イベント画像バケット
CREATE POLICY "Allow public upload to event-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Allow public select from event-images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Allow public update to event-images" ON storage.objects
FOR UPDATE USING (bucket_id = 'event-images');

CREATE POLICY "Allow public delete from event-images" ON storage.objects
FOR DELETE USING (bucket_id = 'event-images');
