-- 创建用户类型枚举
CREATE TYPE user_type AS ENUM ('student', 'tutor');

-- 创建用户状态枚举
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    user_type user_type NOT NULL,
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    avatar_url TEXT DEFAULT '/App_Professeur/Image/default-avatar.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

-- 创建更新最后登录时间的函数
CREATE OR REPLACE FUNCTION update_last_login(user_email VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE email = user_email;
END;
$$ language 'plpgsql';

-- 修改 avatar_url 的默认值
ALTER TABLE users 
ALTER COLUMN avatar_url SET DEFAULT 'https://pbadzkgumtgg1nlmucd.supabase.co/storage/v1/object/public/avatars/test/default-avatar.png';

-- 强制更新所有旧格式的头像URL
UPDATE users 
SET avatar_url = 'https://pbadzkgumtgg1nlmucd.supabase.co/storage/v1/object/public/avatars/test/default-avatar.png'
WHERE avatar_url LIKE '/App_Professeur/Image/%'
   OR avatar_url IS NULL;