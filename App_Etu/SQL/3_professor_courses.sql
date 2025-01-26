-- 删除所有相关的函数和触发器
DROP FUNCTION IF EXISTS update_course_status CASCADE;
DROP FUNCTION IF EXISTS validate_professor CASCADE;

-- 删除表格和类型
DROP TABLE IF EXISTS professor_courses CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;

-- 创建课程状态枚举类型
CREATE TYPE course_status AS ENUM ('en cours', 'à venir', 'terminé');

-- 创建课程表
CREATE TABLE professor_courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                                      -- 课程标题 (例如: Introduction à la Physique)
    description TEXT,                                                 -- 课程描述
    level VARCHAR(50) NOT NULL,                                       -- 课程级别 (例如: Licence 1 - Physique)
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('math', 'physics', 'chemistry', 'info')),  -- 课程科目
    start_date DATE NOT NULL,                                        -- 开始日期 (例如: 1 févr. 2024)
    end_date DATE NOT NULL,                                          -- 结束日期 (例如: 30 mai 2024)
    course_day VARCHAR(20),                                          -- 上课日期 (例如: Mardi)
    course_time_start TIME,                                          -- 上课开始时间 (例如: 10:00)
    course_time_end TIME,                                            -- 上课结束时间 (例如: 12:00)
    professor_id UUID REFERENCES users(id),                          -- 教授ID (关联到users表)
    professor_name VARCHAR(100),                                     -- 教授名字 (例如: Chenggongg ZHANGG)
    capacity INTEGER NOT NULL CHECK (capacity > 0),                  -- 课程容量
    status course_status DEFAULT 'à venir',                          -- 课程状态 (en cours, à venir, terminé)
    progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100), -- 课程进度 (例如: 45%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_time CHECK (course_time_end > course_time_start)
);

-- 创建验证教授身份的触发器函数
CREATE OR REPLACE FUNCTION validate_professor()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = NEW.professor_id 
        AND user_type = 'tutor'
    ) THEN
        RAISE EXCEPTION 'Invalid professor_id: must reference a user with type tutor';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER check_professor_type
    BEFORE INSERT OR UPDATE OF professor_id ON professor_courses
    FOR EACH ROW
    EXECUTE FUNCTION validate_professor();

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
    BEFORE INSERT OR UPDATE OF start_date, end_date ON professor_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_status();

-- 创建课程进度计算触发器函数
CREATE OR REPLACE FUNCTION calculate_course_progression()
RETURNS TRIGGER AS $$
DECLARE
    total_days INTEGER;
    elapsed_days INTEGER;
BEGIN
    -- 只在课程处于进行中状态时计算进度
    IF NEW.status = 'en cours' THEN
        total_days := NEW.end_date - NEW.start_date;
        elapsed_days := CURRENT_DATE - NEW.start_date;
        
        -- 计算进度百分比
        IF total_days > 0 THEN
            NEW.progression := LEAST(100, GREATEST(0, (elapsed_days * 100) / total_days));
        END IF;
    ELSIF NEW.status = 'terminé' THEN
        NEW.progression := 100;
    ELSIF NEW.status = 'à venir' THEN
        NEW.progression := 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER auto_calculate_course_progression
    BEFORE INSERT OR UPDATE OF start_date, end_date, status ON professor_courses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_course_progression(); 