DROP TABLE IF EXISTS professor_events_manual CASCADE;
-- 创建手动事件表
CREATE TABLE IF NOT EXISTS professor_events_manual (
    id SERIAL PRIMARY KEY,                -- 主键（自动递增）
    title TEXT NOT NULL,                   -- 事件标题
    description TEXT,                      -- 事件描述
    start_at TEXT NOT NULL,               -- 开始时间 (ISO格式: YYYY-MM-DDTHH:mm:ss)
    end_at TEXT NOT NULL,                 -- 结束时间 (ISO格式: YYYY-MM-DDTHH:mm:ss)
    color TEXT DEFAULT '#4CAF50',         -- 事件颜色（默认绿色）
    user_id UUID NOT NULL,                -- 用户ID
    professor_id UUID,                    -- 教授ID（可选）
    status TEXT DEFAULT 'active',         -- 事件状态
    location TEXT,                        -- 地点
    is_all_day INTEGER DEFAULT 0,         -- 是否全天事件（0=否，1=是）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (professor_id) REFERENCES users(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_professor_events_manual_user_id ON professor_events_manual(user_id);
CREATE INDEX IF NOT EXISTS idx_professor_events_manual_professor_id ON professor_events_manual(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_events_manual_start ON professor_events_manual(start_at);
CREATE INDEX IF NOT EXISTS idx_professor_events_manual_status ON professor_events_manual(status);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_events_manual_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_manual_timestamp
    BEFORE UPDATE ON professor_events_manual
    FOR EACH ROW
    EXECUTE FUNCTION update_events_manual_timestamp();
