-- 创建课程请求表
CREATE TABLE IF NOT EXISTS course_requests (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id),  -- 关联到学生表
    student_name VARCHAR(100) NOT NULL,              -- 学生姓名
    student_email VARCHAR(100) NOT NULL,             -- 学生邮箱
    study_level VARCHAR(50) NOT NULL,                -- 学习级别
    title VARCHAR(200) NOT NULL,                     -- 课程标题
    message TEXT,                                    -- 请求消息
    status VARCHAR(20) DEFAULT 'En attente',         -- 状态：En attente, Accepté, Refusé
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 请求日期
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 更新时间
    professor_id UUID REFERENCES professors(id),      -- 关联到教授表
    subject VARCHAR(100) NOT NULL,                   -- 课程科目
    preferred_schedule JSONB,                        -- 首选时间安排
    CONSTRAINT status_check CHECK (status IN ('En attente', 'Accepté', 'Refusé'))
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_requests_updated_at
    BEFORE UPDATE ON course_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加索引以提高查询性能
CREATE INDEX idx_course_requests_status ON course_requests(status);
CREATE INDEX idx_course_requests_created_at ON course_requests(created_at);
CREATE INDEX idx_course_requests_student_id ON course_requests(student_id);
CREATE INDEX idx_course_requests_professor_id ON course_requests(professor_id);

-- 插入示例数据
INSERT INTO course_requests (
    student_id,
    student_name,
    student_email,
    study_level,
    title,
    message,
    status,
    professor_id,
    subject,
    preferred_schedule
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000', -- 示例student_id，需要替换为实际存在的ID
    'Sophie Martin',
    'sophie.martin@example.com',
    'L3',
    'Chimie Organique',
    'Je souhaiterais avoir des cours de soutien en chimie organique pour mieux comprendre les mécanismes réactionnels.',
    'En attente',
    '550e8400-e29b-41d4-a716-446655440001', -- 示例professor_id，需要替换为实际存在的ID
    'Chimie',
    '{"preferred_days": ["Mercredi", "Jeudi"], "preferred_times": ["10:00", "14:00"]}'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440002', -- 示例student_id，需要替换为实际存在的ID
    'Lucas Petit',
    'lucas.petit@example.com',
    'M1',
    'Intelligence Artificielle',
    'Je voudrais approfondir mes connaissances en IA, particulièrement en deep learning.',
    'En attente',
    '550e8400-e29b-41d4-a716-446655440001', -- 示例professor_id，需要替换为实际存在的ID
    'Informatique',
    '{"preferred_days": ["Lundi", "Mardi"], "preferred_times": ["13:00", "15:00"]}'::jsonb
);

-- 创建视图以方便查询
CREATE OR REPLACE VIEW v_pending_course_requests AS
SELECT 
    cr.*,
    sp.first_name || ' ' || sp.last_name as student_full_name,
    p.first_name || ' ' || p.last_name as professor_full_name
FROM 
    course_requests cr
    LEFT JOIN student_profiles sp ON cr.student_id = sp.id
    LEFT JOIN professors p ON cr.professor_id = p.id
WHERE 
    cr.status = 'En attente'
ORDER BY 
    cr.created_at DESC;

-- 添加注释
COMMENT ON TABLE course_requests IS '存储学生的课程请求信息';
COMMENT ON COLUMN course_requests.id IS '主键';
COMMENT ON COLUMN course_requests.student_id IS '关联到student_profiles表的外键';
COMMENT ON COLUMN course_requests.student_name IS '学生姓名';
COMMENT ON COLUMN course_requests.student_email IS '学生邮箱';
COMMENT ON COLUMN course_requests.study_level IS '学习级别';
COMMENT ON COLUMN course_requests.title IS '课程标题';
COMMENT ON COLUMN course_requests.message IS '请求消息';
COMMENT ON COLUMN course_requests.status IS '请求状态：等待中、已接受、已拒绝';
COMMENT ON COLUMN course_requests.request_date IS '请求日期';
COMMENT ON COLUMN course_requests.professor_id IS '关联到professors表的外键';
COMMENT ON COLUMN course_requests.subject IS '课程科目';
COMMENT ON COLUMN course_requests.preferred_schedule IS '首选时间安排（JSON格式）'; 