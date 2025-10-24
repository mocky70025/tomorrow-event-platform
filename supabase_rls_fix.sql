-- Supabase RLSポリシー修正
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. exhibitorsテーブルのRLSポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view their own data" ON exhibitors;
DROP POLICY IF EXISTS "Users can insert their own data" ON exhibitors;
DROP POLICY IF EXISTS "Users can update their own data" ON exhibitors;
DROP POLICY IF EXISTS "Allow public insert on exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public select on exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public update on exhibitors" ON exhibitors;

-- 2. 新しいRLSポリシーを作成
CREATE POLICY "Allow public insert on exhibitors" ON exhibitors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on exhibitors" ON exhibitors
    FOR SELECT USING (true);

CREATE POLICY "Allow public update on exhibitors" ON exhibitors
    FOR UPDATE USING (true);

-- 3. organizersテーブルのRLSポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view their own data" ON organizers;
DROP POLICY IF EXISTS "Users can insert their own data" ON organizers;
DROP POLICY IF EXISTS "Users can update their own data" ON organizers;
DROP POLICY IF EXISTS "Allow public insert on organizers" ON organizers;
DROP POLICY IF EXISTS "Allow public select on organizers" ON organizers;
DROP POLICY IF EXISTS "Allow public update on organizers" ON organizers;

-- 4. 新しいRLSポリシーを作成
CREATE POLICY "Allow public insert on organizers" ON organizers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on organizers" ON organizers
    FOR SELECT USING (true);

CREATE POLICY "Allow public update on organizers" ON organizers
    FOR UPDATE USING (true);

-- 5. eventsテーブルのRLSポリシーを削除して再作成
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Organizers can manage their own events" ON events;
DROP POLICY IF EXISTS "Allow public select on events" ON events;
DROP POLICY IF EXISTS "Allow public insert on events" ON events;
DROP POLICY IF EXISTS "Allow public update on events" ON events;

CREATE POLICY "Allow public select on events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on events" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on events" ON events
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on events" ON events
    FOR DELETE USING (true);

-- 6. event_applicationsテーブルのRLSポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view their own applications" ON event_applications;
DROP POLICY IF EXISTS "Allow public select on event_applications" ON event_applications;
DROP POLICY IF EXISTS "Allow public insert on event_applications" ON event_applications;
DROP POLICY IF EXISTS "Allow public update on event_applications" ON event_applications;

CREATE POLICY "Allow public select on event_applications" ON event_applications
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on event_applications" ON event_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on event_applications" ON event_applications
    FOR UPDATE USING (true);
