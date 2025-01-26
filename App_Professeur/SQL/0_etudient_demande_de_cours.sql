-- 删除现有的表格（按照依赖关系的反序删除）
DROP TABLE IF EXISTS course_request_history CASCADE;
DROP TABLE IF EXISTS course_requests CASCADE;

-- 创建课程申请表
CREATE TABLE IF NOT EXISTS course_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                    -- 课程标题
    student_name VARCHAR(255) NOT NULL,             -- 学生姓名
    student_email VARCHAR(255) NOT NULL,            -- 学生邮箱
    student_id UUID REFERENCES users(id),           -- 学生ID
    study_level VARCHAR(50) NOT NULL,               -- 学习级别 (L1, L2, L3, M1, M2)
    request_date DATE NOT NULL,                     -- 申请日期
    message TEXT,                                   -- 申请消息/描述
    status VARCHAR(50) DEFAULT 'En attente',        -- 状态 (En attente, Accepté, Refusé)
    professor_id UUID REFERENCES users(id),         -- 关联的教授ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    course_day VARCHAR(50),                         -- 课程日期 (Lundi, Mardi, etc.)
    start_time TIME NOT NULL,                       -- 开始时间
    end_time TIME NOT NULL,                         -- 结束时间
    CONSTRAINT valid_time_range CHECK (end_time > start_time)  -- 确保结束时间晚于开始时间
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
            NEW.professor_id
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
CREATE INDEX IF NOT EXISTS idx_course_requests_professor_id ON course_requests(professor_id);
CREATE INDEX IF NOT EXISTS idx_course_requests_study_level ON course_requests(study_level);
CREATE INDEX IF NOT EXISTS idx_course_requests_student_id ON course_requests(student_id);

-- 添加示例数据
INSERT INTO course_requests (
    title, 
    student_name, 
    student_email,
    student_id,
    study_level, 
    request_date, 
    message, 
    status,
    course_day,
    start_time,
    end_time
) VALUES 
(
    'Introduction aux Mathématiques',
    'Marie Dubois',
    'marie.dubois@example.com',
    'e1d5ab30-4f72-4aef-b25d-5c956ecc99a1',
    'L2',
    '2024-02-15',
    'Je souhaite suivre ce cours pour approfondir mes connaissances en analyse.',
    'En attente',
    'Lundi',
    '09:00',
    '11:00'
),
(
    'Chimie Organique',
    'Marie Dubois',
    'marie.dubois@example.com',
    'e1d5ab30-4f72-4aef-b25d-5c956ecc99a1',
    'L2',
    '2024-02-16',
    'Je suis très intéressée par la chimie organique et souhaite développer mes compétences dans ce domaine.',
    'En attente',
    'Mercredi',
    '10:00',
    '12:00'
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
