-- 0038_learning_hub.down.sql
-- Reverses 0038_learning_hub.sql. Dropping a table also drops its indexes, its
-- constraints and any trigger attached to it (for example a
-- trg_<table>_touch_updated_at created later by app_attach_updated_at_triggers()),
-- so only the tables are named. Child tables go first: the two join tables
-- reference learning_groups / learning_trainings, and no CASCADE is used so a
-- dependency this file does not know about makes the rollback fail loudly instead
-- of silently dropping someone else's object.

DROP TABLE learning_group_memberships;
DROP TABLE learning_groups;
DROP TABLE learning_training_enrollments;
DROP TABLE learning_trainings;
DROP TABLE learning_videos;
DROP TABLE learning_articles;
