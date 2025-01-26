-- 创建密码重置表
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiry TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- 创建清理过期令牌的函数
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS VOID AS $$
BEGIN
    DELETE FROM password_resets 
    WHERE expiry < CURRENT_TIMESTAMP 
    OR used = true;
END;
$$ LANGUAGE plpgsql;

-- 创建自动清理触发器
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM cleanup_expired_tokens();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_tokens_on_insert
    AFTER INSERT ON password_resets
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_tokens();
