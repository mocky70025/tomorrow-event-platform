-- Supabaseデータベーススキーマ
-- 出店者情報、主催者情報、イベント情報のテーブル作成

-- 1. 出店者情報テーブル
CREATE TABLE exhibitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('男', '女', 'それ以外')),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 99),
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    genre_category VARCHAR(50), -- おおまかなジャンル（プルダウン）
    genre_free_text TEXT, -- ジャンル自由回答
    business_license_image_url TEXT, -- 営業許可証画像URL
    vehicle_inspection_image_url TEXT, -- 車検証画像URL
    automobile_inspection_image_url TEXT, -- 自動車検査証画像URL
    pl_insurance_image_url TEXT, -- PL保険画像URL
    fire_equipment_layout_image_url TEXT, -- 火器類配置図画像URL
    line_user_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 主催者情報テーブル
CREATE TABLE organizers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('男', '女', 'それ以外')),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 99),
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    line_user_id VARCHAR(100) UNIQUE NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. イベント情報テーブル（画像から読み取った項目を含む）
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- 基本情報
    event_name VARCHAR(100) NOT NULL,
    event_name_furigana VARCHAR(100) NOT NULL,
    genre VARCHAR(50) NOT NULL, -- ジャンル（祭り・花火大会など）
    is_shizuoka_vocational_assoc_related BOOLEAN DEFAULT FALSE,
    opt_out_newspaper_publication BOOLEAN DEFAULT FALSE,
    
    -- 開催期間・時間
    event_start_date DATE NOT NULL,
    event_end_date DATE NOT NULL,
    event_display_period VARCHAR(50) NOT NULL,
    event_period_notes VARCHAR(100),
    event_time VARCHAR(50),
    
    -- 申し込み期間
    application_start_date DATE,
    application_end_date DATE,
    application_display_period VARCHAR(50),
    application_notes VARCHAR(250),
    
    -- チケット情報
    ticket_release_start_date DATE,
    ticket_sales_location TEXT,
    
    -- イベント内容
    lead_text VARCHAR(100) NOT NULL,
    event_description VARCHAR(250) NOT NULL,
    event_introduction_text TEXT, -- イベント紹介文（500字以内）
    
    -- 画像情報
    main_image_url TEXT,
    main_image_caption VARCHAR(50),
    additional_image1_url TEXT,
    additional_image1_caption VARCHAR(50),
    additional_image2_url TEXT,
    additional_image2_caption VARCHAR(50),
    additional_image3_url TEXT,
    additional_image3_caption VARCHAR(50),
    additional_image4_url TEXT,
    additional_image4_caption VARCHAR(50),
    
    -- 会場情報
    venue_name VARCHAR(200) NOT NULL,
    venue_postal_code VARCHAR(10),
    venue_city VARCHAR(50),
    venue_town VARCHAR(100),
    venue_address VARCHAR(200),
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    
    -- URL情報
    homepage_url TEXT,
    related_page_url TEXT,
    
    -- 連絡先情報
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    
    -- その他情報
    parking_info TEXT,
    fee_info TEXT,
    organizer_info TEXT,
    
    -- 主催者との関連
    organizer_id UUID REFERENCES organizers(id),
    
    -- システム情報
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 出店申し込みテーブル（出店者とイベントの関連）
CREATE TABLE event_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibitor_id UUID NOT NULL REFERENCES exhibitors(id),
    event_id UUID NOT NULL REFERENCES events(id),
    application_status VARCHAR(20) DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exhibitor_id, event_id)
);

-- インデックスの作成
CREATE INDEX idx_exhibitors_line_user_id ON exhibitors(line_user_id);
CREATE INDEX idx_organizers_line_user_id ON organizers(line_user_id);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(event_start_date);
CREATE INDEX idx_event_applications_exhibitor_id ON event_applications(exhibitor_id);
CREATE INDEX idx_event_applications_event_id ON event_applications(event_id);

-- RLS（Row Level Security）の設定
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_applications ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー（必要に応じて調整）
CREATE POLICY "Users can view their own data" ON exhibitors
    FOR ALL USING (auth.uid()::text = line_user_id);

CREATE POLICY "Users can view their own data" ON organizers
    FOR ALL USING (auth.uid()::text = line_user_id);

CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Organizers can manage their own events" ON events
    FOR ALL USING (organizer_id IN (
        SELECT id FROM organizers WHERE line_user_id = auth.uid()::text
    ));

CREATE POLICY "Users can view their own applications" ON event_applications
    FOR ALL USING (exhibitor_id IN (
        SELECT id FROM exhibitors WHERE line_user_id = auth.uid()::text
    ));
