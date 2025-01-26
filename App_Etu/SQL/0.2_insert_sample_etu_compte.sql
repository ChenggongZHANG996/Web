    -- 首先清空学生档案表
    TRUNCATE TABLE student_profiles CASCADE;

    -- 插入示例学生档案数据，student_id 需要与已存在的 users 表中的 ID 匹配
    INSERT INTO student_profiles (
        student_id, first_name, last_name, email, phone, 
        birth_date, nationality, address, student_number, 
        study_level, major, department, entry_year, 
        academic_status, assigned_professor_id,
        current_courses, course_history, course_preferences,
        overall_progress, course_grades, achievements,
        notes, language_preferences
    ) VALUES 
    ('e1d5ab30-4f72-4aef-b25d-5c956ecc99a1', 'Marie', 'Dubois', 'marie.dubois@example.com', '+33123456789',
    '2000-05-15', 'French', '123 Rue de Paris', 'STU2025001',
    'L1', 'Mathematics', 'Science Department', 2025,
    'active', 'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    jsonb_build_array(
        jsonb_build_object(
            'course_id', 1,
            'title', 'Introduction aux Mathématiques',
            'description', 'Cours fondamental de mathématiques',
            'schedule', jsonb_build_object(
                'start_time', '09:00',
                'end_time', '11:00',
                'start_date', '2025-01-01',
                'end_date', '2025-03-31',
                'is_weekly', true,
                'day_of_week', 'Lundi'
            )
        )
    ),
    '[]'::jsonb,
    '[]'::jsonb,
    75,
    '{"math_101": 85, "math_102": 78}'::jsonb,
    '[]'::jsonb,
    'Excellent en algèbre',
    ARRAY['French', 'English']
    ),

    ('e2d5ab30-4f72-4aef-b25d-5c956ecc99a2', 'Thomas', 'Bernard', 'thomas.bernard@example.com', '+33234567890',
    '2001-03-20', 'French', '456 Avenue de Lyon', 'STU2025002',
    'L2', 'Physics', 'Science Department', 2025,
    'active', 'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    jsonb_build_array(
        jsonb_build_object(
            'course_id', 2,
            'title', 'Mécanique Quantique',
            'description', 'Introduction à la mécanique quantique',
            'schedule', jsonb_build_object(
                'start_time', '14:00',
                'end_time', '16:00',
                'start_date', '2025-01-01',
                'end_date', '2025-03-31',
                'is_weekly', true,
                'day_of_week', 'Mardi'
            )
        )
    ),
    '[]'::jsonb,
    '[]'::jsonb,
    82,
    '{"phys_201": 88, "phys_202": 85}'::jsonb,
    '[]'::jsonb,
    'Fort intérêt pour la physique théorique',
    ARRAY['French', 'English']
    ),

    ('e3d5ab30-4f72-4aef-b25d-5c956ecc99a3', 'Sophie', 'Martin', 'sophie.martin@example.com', '+33345678901',
    '2000-11-10', 'French', '789 Boulevard de Marseille', 'STU2025003',
    'L3', 'Chemistry', 'Science Department', 2025,
    'active', 'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    jsonb_build_array(
        jsonb_build_object(
            'course_id', 4,
            'title', 'Chimie Organique',
            'description', 'Étude approfondie de la chimie organique',
            'schedule', jsonb_build_object(
                'start_time', '10:00',
                'end_time', '12:00',
                'start_date', '2025-01-01',
                'end_date', '2025-03-31',
                'is_weekly', true,
                'day_of_week', 'Mercredi'
            )
        )
    ),
    '[]'::jsonb,
    '[]'::jsonb,
    88,
    '{"chem_301": 92, "chem_302": 89}'::jsonb,
    '[]'::jsonb,
    'Excellente en travaux pratiques',
    ARRAY['French', 'English']
    ),

    ('e4d5ab30-4f72-4aef-b25d-5c956ecc99a4', 'Lucas', 'Petit', 'lucas.petit@example.com', '+33456789012',
    '2001-07-25', 'French', '321 Rue de Bordeaux', 'STU2025004',
    'M1', 'Computer Science', 'Science Department', 2025,
    'active', 'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    jsonb_build_array(
        jsonb_build_object(
            'course_id', 5,
            'title', 'Intelligence Artificielle',
            'description', 'Introduction aux concepts de l''IA',
            'schedule', jsonb_build_object(
                'start_time', '13:00',
                'end_time', '15:00',
                'start_date', '2025-01-01',
                'end_date', '2025-03-31',
                'is_weekly', true,
                'day_of_week', 'Jeudi'
            )
        )
    ),
    '[]'::jsonb,
    '[]'::jsonb,
    85,
    '{"cs_401": 87, "cs_402": 90}'::jsonb,
    '[]'::jsonb,
    'Passionné par l''IA et le machine learning',
    ARRAY['French', 'English']
    );

    -- 更新统计信息
    ANALYZE student_profiles;
