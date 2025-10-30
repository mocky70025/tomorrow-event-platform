-- イベント承認ステータスの追加と初期設定

-- 既に列がある場合はスキップされます（存在チェックは手動で）
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
  CHECK (approval_status IN ('pending','approved','rejected'));

-- 既存レコードのNULLをpendingに揃える
UPDATE events SET approval_status = 'pending' WHERE approval_status IS NULL;


