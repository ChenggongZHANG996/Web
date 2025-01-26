-- 删除现有的表和类型（如果存在）
DROP TABLE IF EXISTS professor_profiles CASCADE;
DROP TYPE IF EXISTS professor_status CASCADE;

-- 创建教师状态枚举类型
CREATE TYPE professor_status AS ENUM ('active', 'inactive', 'on_leave');

-- 创建教师账户表
CREATE TABLE professor_profiles (
    id SERIAL PRIMARY KEY,                                           -- 教师档案ID
    professor_id UUID REFERENCES users(id),                         -- 关联到users表的UUID
    first_name VARCHAR(100),                                        -- 名
    last_name VARCHAR(100),                                         -- 姓
    email VARCHAR(255) UNIQUE,                                      -- 邮箱
    phone VARCHAR(20),                                              -- 电话
    birth_date DATE,                                                -- 出生日期
    nationality VARCHAR(50),                                        -- 国籍
    address TEXT,                                                   -- 地址

    -- 教师信息
    title VARCHAR(50),                                              -- 职称 (例如：Professor, Associate Professor)
    department VARCHAR(100),                                        -- 院系
    specialties VARCHAR(50)[],                                      -- 专业领域
    employee_number VARCHAR(50),                                    -- 工号
    hire_date DATE,                                                -- 入职日期
    employment_status professor_status DEFAULT 'active',            -- 在职状态

    -- 课程相关信息
    current_courses JSONB DEFAULT '[]'::jsonb,                      -- 当前教授的课程
    course_history JSONB DEFAULT '[]'::jsonb,                       -- 历史教授课程
    teaching_preferences JSONB DEFAULT '{}'::jsonb,                 -- 教学偏好设置
    
    -- 教学信息
    teaching_hours INTEGER DEFAULT 0,                               -- 总教学时数
    student_count INTEGER DEFAULT 0,                                -- 当前学生数量
    course_evaluations JSONB DEFAULT '{}'::jsonb,                   -- 课程评估记录
    achievements JSONB DEFAULT '[]'::jsonb,                         -- 教学成就和证书

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,                        -- 最后登录时间

    -- 其他信息
    notes TEXT,                                                    -- 备注
    office_location TEXT,                                          -- 办公室位置
    office_hours JSONB DEFAULT '[]'::jsonb,                        -- 办公时间
    language_preferences VARCHAR(10)[] DEFAULT ARRAY['fr']::VARCHAR(10)[], -- 语言偏好

    CONSTRAINT valid_teaching_hours CHECK (teaching_hours >= 0),
    CONSTRAINT valid_student_count CHECK (student_count >= 0),
    CONSTRAINT valid_hire_date CHECK (hire_date <= CURRENT_DATE)
);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_professor_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_professor_profile_timestamp
    BEFORE UPDATE ON professor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_professor_profile_timestamp();

-- 创建索引以提高查询性能
CREATE INDEX idx_professor_profiles_professor_id ON professor_profiles(professor_id);
CREATE INDEX idx_professor_profiles_employment_status ON professor_profiles(employment_status);
CREATE INDEX idx_professor_profiles_department ON professor_profiles(department);
CREATE INDEX idx_professor_profiles_specialties ON professor_profiles USING gin(specialties);

-- 添加注释
COMMENT ON TABLE professor_profiles IS '存储教师的详细信息，包括个人信息、教学信息和课程记录';
COMMENT ON COLUMN professor_profiles.professor_id IS '关联到users表的UUID，用于身份验证';
COMMENT ON COLUMN professor_profiles.current_courses IS '当前正在教授的课程列表';
COMMENT ON COLUMN professor_profiles.course_history IS '历史教授课程记录';
COMMENT ON COLUMN professor_profiles.teaching_preferences IS '教师的教学偏好设置';
COMMENT ON COLUMN professor_profiles.teaching_hours IS '教师的总教学时数';
COMMENT ON COLUMN professor_profiles.student_count IS '当前指导的学生数量';
COMMENT ON COLUMN professor_profiles.course_evaluations IS '课程评估记录';
COMMENT ON COLUMN professor_profiles.achievements IS '教师获得的教学成就和证书记录';
COMMENT ON COLUMN professor_profiles.office_hours IS '教师的办公时间安排';

-- 删除不再需要的学生相关触发器
DROP TRIGGER IF EXISTS handle_course_request_acceptance_trigger ON course_requests;
DROP FUNCTION IF EXISTS handle_course_request_acceptance();
