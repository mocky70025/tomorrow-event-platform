-- テスト用データ作成スクリプト
-- SupabaseのSQL Editorで実行してください

-- 1. テスト用主催者を作成
INSERT INTO organizers (
  company_name, name, gender, age, phone_number, email, line_user_id, is_approved
) VALUES (
  'テスト会社', 'テスト太郎', '男', 30, '090-1234-5678', 'test@example.com', 'test_organizer_123', true
);

-- 2. テスト用イベントを複数作成
INSERT INTO events (
  event_name, event_name_furigana, genre, event_start_date, event_end_date,
  event_display_period, lead_text, event_description, venue_name, venue_city,
  organizer_id
) VALUES 
(
  'テスト祭り2024', 'テストまつり2024', '祭り', '2024-12-01', '2024-12-03',
  '12月1日〜3日', '楽しいテストイベントです', '出店者向けのテスト用イベントです。様々なジャンルの出店をお待ちしています。',
  'テスト会場', '静岡県静岡市',
  (SELECT id FROM organizers WHERE line_user_id = 'test_organizer_123')
),
(
  '冬のマーケット', 'ふゆのまーけっと', '物販', '2024-12-15', '2024-12-17',
  '12月15日〜17日', '冬の特別マーケット', '手作り雑貨やアート作品の展示販売会です。',
  '静岡市文化会館', '静岡県静岡市',
  (SELECT id FROM organizers WHERE line_user_id = 'test_organizer_123')
),
(
  'フードフェスティバル', 'ふーどふぇすてぃばる', '飲食', '2024-12-22', '2024-12-24',
  '12月22日〜24日', '美味しいグルメの祭典', '地元の名店が集まるフードフェスティバルです。',
  '静岡駅前広場', '静岡県静岡市',
  (SELECT id FROM organizers WHERE line_user_id = 'test_organizer_123')
),
(
  'アート展覧会', 'あーとてんらんかい', 'アート', '2024-12-28', '2024-12-30',
  '12月28日〜30日', '現代アートの展示会', '若手アーティストの作品を展示する展覧会です。',
  '静岡県立美術館', '静岡県静岡市',
  (SELECT id FROM organizers WHERE line_user_id = 'test_organizer_123')
),
(
  '新年イベント', 'しんねんいべんと', 'その他', '2025-01-01', '2025-01-03',
  '1月1日〜3日', '新年を祝うイベント', '新年を祝う特別なイベントです。',
  '静岡市役所前', '静岡県静岡市',
  (SELECT id FROM organizers WHERE line_user_id = 'test_organizer_123')
);
