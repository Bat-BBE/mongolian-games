-- Тоглоомын профайл, прогресс (үндсэн өгөгдөл PostgreSQL-д).

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS hero_id TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS progress JSONB NOT NULL DEFAULT '{}'::jsonb;
