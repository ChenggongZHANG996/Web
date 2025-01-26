-- 删除现有的表格（如果存在）
DROP TABLE IF EXISTS student_courses CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;

-- 创建课程状态枚举类型
CREATE TYPE course_status AS ENUM ('en cours', 'à venir', 'terminé');

-- 创建学生课程表
CREATE TABLE student_courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                                      -- 课程标题
    description TEXT,                                                 -- 课程描述
    level VARCHAR(50) NOT NULL,                                       -- 课程级别 (L1, L2, L3, M1, M2)
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('math', 'physics', 'chemistry', 'info')),  -- 课程科目
    start_date DATE NOT NULL,                                        -- 开始日期
    end_date DATE NOT NULL,                                          -- 结束日期
    course_day VARCHAR(20),                                          -- 上课日期 (例如: Mardi)
    course_time_start TIME,                                          -- 上课开始时间
    course_time_end TIME,                                            -- 上课结束时间
    student_id UUID REFERENCES users(id),                            -- 学生ID
    professor_id UUID REFERENCES users(id),                          -- 教授ID
    professor_name VARCHAR(100),                                     -- 教授姓名
    status course_status DEFAULT 'à venir',                          -- 课程状态
    progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100), -- 课程进度
    grade NUMERIC(4,2) CHECK (grade >= 0 AND grade <= 20),          -- 课程成绩（0-20分制）
    attendance_rate INTEGER DEFAULT 0 CHECK (attendance_rate >= 0 AND attendance_rate <= 100), -- 出勤率
    notes TEXT,                                                      -- 课程笔记
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_time CHECK (course_time_end > course_time_start)
);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_student_course_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_student_course_timestamp
    BEFORE UPDATE ON student_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_student_course_timestamp();

-- 创建自动更新课程状态的函数
CREATE OR REPLACE FUNCTION update_course_status()
RETURNS TRIGGER AS $$
DECLARE
    new_status course_status;
BEGIN
    -- 计算新状态
    IF CURRENT_DATE < NEW.start_date THEN
        new_status := 'à venir'::course_status;
    ELSIF CURRENT_DATE > NEW.end_date THEN
        new_status := 'terminé'::course_status;
    ELSE
        new_status := 'en cours'::course_status;
    END IF;

    NEW.status = new_status;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器，在插入或更新日期时自动更新状态
CREATE TRIGGER auto_update_course_status
    BEFORE INSERT OR UPDATE OF start_date, end_date ON student_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_status();

-- 创建索引以提高查询性能
CREATE INDEX idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX idx_student_courses_professor_id ON student_courses(professor_id);
CREATE INDEX idx_student_courses_status ON student_courses(status);
CREATE INDEX idx_student_courses_subject ON student_courses(subject);
CREATE INDEX idx_student_courses_level ON student_courses(level);
CREATE INDEX idx_student_courses_dates ON student_courses(start_date, end_date);

-- 添加注释
COMMENT ON TABLE student_courses IS '存储学生的课程信息，包括课程详情、进度和成绩';
COMMENT ON COLUMN student_courses.progression IS '课程完成进度（0-100）';
COMMENT ON COLUMN student_courses.grade IS '课程成绩（0-20分制）';
COMMENT ON COLUMN student_courses.attendance_rate IS '课程出勤率（0-100）';