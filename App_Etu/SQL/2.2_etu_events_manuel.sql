-- 创建手动事件表
CREATE TABLE IF NOT EXISTS student_events_manual (
    id SERIAL PRIMARY KEY,                -- 主键（自动递增）
    title TEXT NOT NULL,                   -- 事件标题
    description TEXT,                      -- 事件描述
    start_date DATE NOT NULL,             -- 开始日期
    end_date DATE NOT NULL,               -- 结束日期
    start_time TIME NOT NULL,             -- 开始时间
    end_time TIME NOT NULL,               -- 结束时间
    color TEXT DEFAULT '#4CAF50',         -- 事件颜色（默认绿色）
    student_id UUID NOT NULL,             -- 学生ID
    event_type TEXT DEFAULT 'personal',   -- 事件类型（personal=个人事件, study=学习相关, exam=考试）
    status TEXT DEFAULT 'active',         -- 事件状态
    location TEXT,                        -- 地点
    is_all_day INTEGER DEFAULT 0,         -- 是否全天事件（0=否，1=是）
    reminder_time INTEGER,                -- 提醒时间（分钟）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (student_id) REFERENCES users(id),
    
    -- 检查约束
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_event_type CHECK (event_type IN ('personal', 'study', 'exam'))
);

-- 创建验证学生类型的触发器函数
CREATE OR REPLACE FUNCTION check_student_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = NEW.student_id AND user_type = 'student'
    ) THEN
        RAISE EXCEPTION 'Invalid student_id: must reference a user with type student';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建验证学生类型的触发器
CREATE TRIGGER check_student_type_trigger
    BEFORE INSERT OR UPDATE OF student_id ON student_events_manual
    FOR EACH ROW
    EXECUTE FUNCTION check_student_type();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_student_events_manual_student_id ON student_events_manual(student_id);
CREATE INDEX IF NOT EXISTS idx_student_events_manual_date_range ON student_events_manual(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_student_events_manual_status ON student_events_manual(status);
CREATE INDEX IF NOT EXISTS idx_student_events_manual_event_type ON student_events_manual(event_type);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_student_events_manual_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_events_manual_timestamp
    BEFORE UPDATE ON student_events_manual
    FOR EACH ROW
    EXECUTE FUNCTION update_student_events_manual_timestamp();
