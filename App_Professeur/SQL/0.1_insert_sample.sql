-- 插入课程申请示例数据
INSERT INTO course_requests (
    title,
    student_name,
    student_email,
    study_level,
    request_date,
    message,
    status
) VALUES 
-- 第一个示例：数学课程申请
(
    'Mathématiques Avancées',
    'Marie Dubois',
    'marie.dubois@estia.fr',
    'L2',
    '2024-02-15',
    'Je souhaite suivre ce cours pour approfondir mes connaissances en analyse.',
    'En attente'
),
-- 第二个示例：物理课程申请
(
    'Physique Quantique',
    'Thomas Bernard',
    'thomas.bernard@estia.fr',
    'M1',
    '2024-02-14',
    'Je suis très intéressé par la mécanique quantique et souhaite approfondir mes connaissances.',
    'En attente'
);

-- 确保数据插入后更新统计信息
ANALYZE course_requests;
