CREATE TABLE professor_specialties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为 UUID 类型
    specialty_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(professor_id, specialty_name)
);