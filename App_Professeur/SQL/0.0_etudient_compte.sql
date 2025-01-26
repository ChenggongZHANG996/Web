-- 删除现有的表和类型（如果存在）
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TYPE IF EXISTS student_status CASCADE;

-- 创建学生状态枚举类型
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'suspended');

-- 创建学生账户表
CREATE TABLE student_profiles (
    id SERIAL PRIMARY KEY,                                           -- 学生档案ID
    student_id UUID REFERENCES users(id),                           -- 关联到users表的UUID
    first_name VARCHAR(100),                                        -- 名
    last_name VARCHAR(100),                                         -- 姓
    email VARCHAR(255) UNIQUE,                                      -- 邮箱
    phone VARCHAR(20),                                              -- 电话
    birth_date DATE,                                                -- 出生日期
    nationality VARCHAR(50),                                        -- 国籍
    address TEXT,                                                   -- 地址

    -- 学术信息
    study_level VARCHAR(50),                                        -- 学习级别 (L1, L2, L3, M1, M2)
    major VARCHAR(50),                                              -- 专业
    department VARCHAR(100),                                        -- 院系
    student_number VARCHAR(50),                                     -- 学号
    entry_year INTEGER,                                            -- 入学年份
    academic_status student_status DEFAULT 'active',                -- 学术状态

    -- 课程相关信息（参考professor_courses表）
    current_courses JSONB DEFAULT '[]'::jsonb,                      -- 当前课程列表，包含课程ID和状态
    course_history JSONB DEFAULT '[]'::jsonb,                       -- 历史课程记录
    course_preferences JSONB DEFAULT '{}'::jsonb,                   -- 课程偏好设置
    
    -- 进度和成绩信息
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100), -- 总体学习进度
    course_grades JSONB DEFAULT '{}'::jsonb,                        -- 各课程成绩
    achievements JSONB DEFAULT '[]'::jsonb,                         -- 成就和证书

    -- 教师关联
    assigned_professor_id UUID REFERENCES users(id),                -- 分配的指导教师ID
    secondary_professor_ids UUID[] DEFAULT ARRAY[]::UUID[],        -- 其他任课教师ID列表

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,                        -- 最后登录时间

    -- 其他信息
    notes TEXT,                                                    -- 备注
    special_requirements TEXT,                                     -- 特殊要求
    language_preferences VARCHAR(10)[] DEFAULT ARRAY['fr']::VARCHAR(10)[], -- 语言偏好

    CONSTRAINT valid_progress CHECK (overall_progress >= 0 AND overall_progress <= 100),
    CONSTRAINT valid_entry_year CHECK (entry_year >= 2000 AND entry_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_student_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_student_profile_timestamp
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_student_profile_timestamp();

-- 创建索引以提高查询性能
CREATE INDEX idx_student_profiles_student_id ON student_profiles(student_id);
CREATE INDEX idx_student_profiles_academic_status ON student_profiles(academic_status);
CREATE INDEX idx_student_profiles_study_level ON student_profiles(study_level);
CREATE INDEX idx_student_profiles_assigned_professor ON student_profiles(assigned_professor_id);

-- 添加注释
COMMENT ON TABLE student_profiles IS '存储学生的详细信息，包括个人信息、学术信息和课程记录';
COMMENT ON COLUMN student_profiles.student_id IS '关联到users表的UUID，用于身份验证';
COMMENT ON COLUMN student_profiles.current_courses IS '当前正在学习的课程列表，使用JSONB存储课程ID和状态';
COMMENT ON COLUMN student_profiles.course_history IS '已完成的课程历史记录';
COMMENT ON COLUMN student_profiles.course_preferences IS '学生的课程偏好设置，如喜欢的科目、学习方式等';
COMMENT ON COLUMN student_profiles.overall_progress IS '学生的总体学习进度（0-100）';
COMMENT ON COLUMN student_profiles.course_grades IS '各课程的成绩记录';
COMMENT ON COLUMN student_profiles.achievements IS '学生获得的成就和证书记录';
COMMENT ON COLUMN student_profiles.assigned_professor_id IS '分配的主要指导教师ID';
COMMENT ON COLUMN student_profiles.secondary_professor_ids IS '其他任课教师ID列表';

-- 创建自动处理课程申请的触发器函数
CREATE OR REPLACE FUNCTION handle_course_request_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    course_info JSONB;
BEGIN
    -- 只在课程申请被接受时处理
    IF NEW.status = 'Accepté' AND OLD.status != 'Accepté' THEN
        -- 确保 professor_id 不为空
        IF NEW.professor_id IS NULL THEN
            RAISE EXCEPTION 'professor_id cannot be null when accepting a course request';
        END IF;

        -- 构建课程信息
        course_info = jsonb_build_object(
            'course_id', NEW.id,
            'title', NEW.title,
            'start_date', NEW.request_date,
            'status', 'active',
            'professor_id', NEW.professor_id
        );

        -- 创建或更新学生档案
        INSERT INTO student_profiles (
            student_id,
            first_name,
            last_name,
            email,
            study_level,
            assigned_professor_id,
            current_courses,
            academic_status
        )
        VALUES (
            NEW.student_id,
            split_part(NEW.student_name, ' ', 1),  -- 假设名字格式为 "名 姓"
            split_part(NEW.student_name, ' ', 2),
            NEW.student_email,
            NEW.study_level,
            NEW.professor_id,
            jsonb_build_array(course_info),
            'active'
        )
        ON CONFLICT (student_id) DO UPDATE SET
            study_level = EXCLUDED.study_level,
            current_courses = CASE 
                WHEN student_profiles.current_courses IS NULL THEN jsonb_build_array(course_info)
                ELSE student_profiles.current_courses || course_info
            END,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS handle_course_request_acceptance_trigger ON course_requests;
CREATE TRIGGER handle_course_request_acceptance_trigger
    AFTER UPDATE ON course_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_course_request_acceptance();

-- 添加注释
COMMENT ON FUNCTION handle_course_request_acceptance() IS '当课程申请被接受时，自动创建或更新学生档案';
