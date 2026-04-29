-- Backfill legacy display names (email/empty) to nickname-style values.
-- Also mirrors the nickname into profile.name so old UI readers stay consistent.

WITH nick_targets AS (
  SELECT
    id,
    ('Player' || substr(md5(id::text), 1, 6))::text AS nickname
  FROM app_users
  WHERE
    display_name IS NULL
    OR btrim(display_name) = ''
    OR position('@' in display_name) > 0
)
UPDATE app_users u
SET
  display_name = t.nickname,
  profile = jsonb_set(
    COALESCE(u.profile, '{}'::jsonb),
    '{name}',
    to_jsonb(t.nickname),
    true
  ),
  updated_at = now()
FROM nick_targets t
WHERE u.id = t.id;
