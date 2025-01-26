-- 删除已存在的表和类型
DROP TABLE IF EXISTS professor_events CASCADE;
DROP TABLE IF EXISTS recurring_events CASCADE;

-- 删除已存在的视图
DROP VIEW IF EXISTS professor_events_view CASCADE;

-- 创建事件表
CREATE TABLE professor_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- 星期几 (Lundi, Mardi, etc.)
    is_weekly BOOLEAN DEFAULT true, -- 是否每周重复
    course_id INTEGER REFERENCES professor_courses(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    color VARCHAR(7), -- 事件颜色，例如 #4CAF50
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 基本约束
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_day_of_week CHECK (
        day_of_week IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')
    )
);

-- 创建索引以提高查询性能
CREATE INDEX idx_professor_events_professor_id ON professor_events(professor_id);
CREATE INDEX idx_professor_events_date_range ON professor_events(start_date, end_date);
CREATE INDEX idx_professor_events_day_of_week ON professor_events(day_of_week);
CREATE INDEX idx_professor_events_course_id ON professor_events(course_id);
CREATE INDEX idx_professor_events_is_weekly ON professor_events(is_weekly);

-- 创建视图来简化事件查询
CREATE OR REPLACE VIEW professor_events_view AS
SELECT 
    e.*,
    u.first_name,
    u.last_name,
    u.email,
    c.subject,
    c.level,
    c.capacity,
    c.progression
FROM 
    professor_events e
    LEFT JOIN professor_courses c ON e.course_id = c.id
    LEFT JOIN users u ON e.professor_id = u.id
WHERE 
    u.user_type = 'tutor';

-- 添加注释
COMMENT ON TABLE professor_events IS '教授课程和其他事件的日历表';
COMMENT ON COLUMN professor_events.day_of_week IS '事件发生的星期几（用于重复性事件）';
COMMENT ON COLUMN professor_events.is_weekly IS '是否为每周重复的事件';
COMMENT ON COLUMN professor_events.professor_id IS '关联到users表的教授ID';