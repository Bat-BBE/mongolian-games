-- Rewrite each user's `profile.heroModelPath` to match the current GLB
-- paths so sessions that were registered before the hero asset swap no
-- longer load the stale X Bot / FBX models.
-- `profile` is a JSONB column on `app_users`. We only touch rows whose
-- heroId maps to a known hero.

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero1.glb'::text),
      true
    )
WHERE profile ->> 'heroId' = 'shikhikhutag';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero2.glb'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero3.glb'::text),
      true
    )
WHERE profile ->> 'heroId' = 'subutai';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero4.glb'::text),
      true
    )
WHERE profile ->> 'heroId' = 'rashid';

-- Also make the migration idempotent for the master heroes table in case
-- an admin UI mutation reverted the path after 011 ran.
UPDATE heroes SET model_path = '/models/hero1.glb' WHERE slug = 'shikhikhutag';
UPDATE heroes SET model_path = '/models/hero2.glb' WHERE slug = 'tatatunga';
UPDATE heroes SET model_path = '/models/hero3.glb' WHERE slug = 'subutai';
UPDATE heroes SET model_path = '/models/hero4.glb' WHERE slug = 'rashid';
