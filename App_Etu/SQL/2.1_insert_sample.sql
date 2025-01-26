-- 清空现有数据
TRUNCATE TABLE professor_events CASCADE;

-- 插入事件数据
INSERT INTO professor_events (
    title,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    day_of_week,
    is_weekly,
    course_id,
    professor_id,
    color
) VALUES 
-- 物理课程
(
    'Introduction à la Physique',
    'Cours d''introduction à la physique pour les débutants',
    '2025-02-15',
    '2025-06-30',
    '08:00',
    '10:00',
    'Mardi',
    true,
    (SELECT id FROM professor_courses WHERE title = 'Introduction à la Physique'),
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    '#2196F3'
),
-- 数学课程
(
    'Mathématiques Avancées',
    'Cours de mathématiques de niveau avancé',
    '2025-02-15',
    '2025-06-30',
    '10:00',
    '12:00',
    'Jeudi',
    true,
    (SELECT id FROM professor_courses WHERE title = 'Mathématiques Avancées'),
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    '#4CAF50'
),
-- 化学课程
(
    'Chimie Organique',
    'Introduction à la chimie organique',
    '2025-02-15',
    '2025-06-30',
    '14:00',
    '16:00',
    'Lundi',
    true,
    (SELECT id FROM professor_courses WHERE title = 'Chimie Organique'),
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    '#F44336'
),
-- 编程课程
(
    'Programmation Avancée',
    'Cours de programmation avancée',
    '2025-02-15',
    '2025-06-30',
    '16:00',
    '18:00',
    'Mercredi',
    true,
    (SELECT id FROM professor_courses WHERE title = 'Programmation Avancée'),
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    '#9C27B0'
);
