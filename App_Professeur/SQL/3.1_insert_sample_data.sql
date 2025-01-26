-- 不需要更新用户类型，因为已经是tutor了
-- 插入示例课程数据
INSERT INTO professor_courses (
    title,
    description,
    level,
    subject,
    start_date,
    end_date,
    course_day,
    course_time_start,
    course_time_end,
    professor_id,
    professor_name,
    capacity,
    status,
    progression
) VALUES 
-- 第一个课程：Introduction à la Physique
(
    'Introduction à la Physique',
    'Cours d''introduction aux concepts fondamentaux de la physique',
    'Licence 1 - Physique',
    'physics',
    '2024-02-01',
    '2024-05-30',
    'Mardi',
    '10:00',
    '12:00',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'Chenggongg ZHANGG',
    30,
    'en cours'::course_status,
    45
),
-- 第二个课程：Mathématiques Avancées
(
    'Mathématiques Avancées',
    'Cours de mathématiques pour les étudiants avancés',
    'Licence 3 - Mathématiques',
    'math',
    '2024-02-15',
    '2024-06-15',
    'Jeudi',
    '14:00',
    '16:00',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'Chenggongg ZHANGG',
    25,
    'en cours'::course_status,
    35
),
-- 第三个课程：Chimie Organique
(
    'Chimie Organique',
    'Introduction à la chimie organique',
    'Licence 2 - Chimie',
    'chemistry',
    '2024-03-01',
    '2024-06-30',
    'Lundi',
    '13:00',
    '15:00',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'Chenggongg ZHANGG',
    20,
    'à venir'::course_status,
    0
),
-- 第四个课程：Programmation Avancée
(
    'Programmation Avancée',
    'Cours de programmation avancée pour les étudiants en informatique',
    'Master 1 - Informatique',
    'info',
    '2023-09-01',
    '2024-01-31',
    'Vendredi',
    '09:00',
    '11:00',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'Chenggongg ZHANGG',
    25,
    'terminé'::course_status,
    100
),
-- 第五个课程：Mécanique Quantique
(
    'Mécanique Quantique',
    'Cours avancé de mécanique quantique',
    'Master 2 - Physique',
    'physics',
    '2024-02-10',
    '2024-06-20',
    'Mercredi',
    '15:00',
    '17:00',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'Chenggongg ZHANGG',
    20,
    'en cours'::course_status,
    30
),
-- 第六个课程：Statistiques et Probabilités
(
    'Statistiques et Probabilités',
    'Cours de statistiques et probabilités pour les mathématiciens',
    'Licence 2 - Mathématiques',
    'math',
    '2024-03-15',
    '2024-07-15',
    'Mardi',
    '16:00',
    '18:00',
    'c7d52a50-3cff-484e-bf2b-8aa7d35389a3',
    'Chenggongg ZHANGG',
    30,
    'à venir'::course_status,
    0
);

-- 修改自动更新状态的函数
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

    -- 更新状态
    UPDATE professor_courses
    SET status = new_status
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 修改每日更新函数
CREATE OR REPLACE FUNCTION update_all_courses_status()
RETURNS void AS $$
BEGIN
    UPDATE professor_courses pc
    SET status = (
        CASE 
            WHEN CURRENT_DATE < pc.start_date THEN 'à venir'::course_status
            WHEN CURRENT_DATE > pc.end_date THEN 'terminé'::course_status
            ELSE 'en cours'::course_status
        END
    );
END;
$$ language 'plpgsql'; 