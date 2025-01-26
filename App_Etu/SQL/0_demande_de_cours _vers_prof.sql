-- 删除现有的表格（按照依赖关系的反序删除）
DROP TABLE IF EXISTS course_request_history CASCADE;
DROP TABLE IF EXISTS course_requests CASCADE;

-- 创建课程申请表
CREATE TABLE IF NOT EXISTS course_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                    -- 课程标题
    professor_name VARCHAR(255) NOT NULL,           -- 教师姓名
    professor_email VARCHAR(255) NOT NULL,          -- 教师邮箱
    professor_id UUID REFERENCES users(id),         -- 教师ID
    subject VARCHAR(50) NOT NULL,                   -- 课程科目 (math, physics, chemistry, info)
    level VARCHAR(50) NOT NULL,                     -- 教学级别 (L1, L2, L3, M1, M2)
    request_date DATE NOT NULL,                     -- 申请日期
    message TEXT,                                   -- 申请消息/描述
    status VARCHAR(50) DEFAULT 'En attente',        -- 状态 (En attente, Accepté, Refusé)
    student_id UUID REFERENCES users(id),           -- 关联的学生ID
    max_students INTEGER DEFAULT 1,                 -- 最大学生数量
    course_start_date DATE,                         -- 课程开始日期
    course_end_date DATE,                          -- 课程结束日期
    course_schedule JSONB,                         -- 课程时间安排
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建审核历史表
CREATE TABLE IF NOT EXISTS course_request_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES course_requests(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);

-- 创建更新时间和状态变更的组合触发器函数
CREATE OR REPLACE FUNCTION handle_course_request_update()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新时间戳
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- 记录状态变更
    IF OLD.status != NEW.status THEN
        INSERT INTO course_request_history (
            request_id,
            old_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.student_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建组合触发器
DROP TRIGGER IF EXISTS handle_course_request_update ON course_requests;
CREATE TRIGGER handle_course_request_update
    BEFORE UPDATE ON course_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_course_request_update();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_course_requests_status ON course_requests(status);
CREATE INDEX IF NOT EXISTS idx_course_requests_student_id ON course_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_course_requests_level ON course_requests(level);
CREATE INDEX IF NOT EXISTS idx_course_requests_professor_id ON course_requests(professor_id);
CREATE INDEX IF NOT EXISTS idx_course_requests_subject ON course_requests(subject);

-- 添加示例数据
INSERT INTO course_requests (
    title, 
    professor_name, 
    professor_email,
    professor_id,
    subject,
    level, 
    request_date, 
    message,
    course_start_date,
    course_end_date,
    course_schedule,
    max_students,
    status
) VALUES 
(
    'Mathématiques Avancées',
    'Prof. Jean Dupont',
    'jean.dupont@example.com',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'math',
    'L2',
    '2025-02-15',
    'Je propose un cours de mathématiques avancées pour les étudiants intéressés par l''analyse.',
    '2025-03-01',
    '2025-06-30',
    '{"day": "Lundi", "start_time": "14:00", "end_time": "16:00", "is_weekly": true}',
    15,
    'En attente'
),
(
    'Physique Quantique',
    'Prof. Jean Dupont',
    'jean.dupont@example.com',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'physics',
    'M1',
    '2025-02-16',
    'Cours de physique quantique pour les étudiants de niveau Master.',
    '2025-03-01',
    '2025-06-30',
    '{"day": "Mercredi", "start_time": "10:00", "end_time": "12:00", "is_weekly": true}',
    10,
    'En attente'
);

-- 创建状态更新函数
CREATE OR REPLACE FUNCTION update_course_request_status(
    request_id INTEGER,
    new_status VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
    UPDATE course_requests 
    SET 
        status = new_status
    WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;
