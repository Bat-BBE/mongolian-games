-- Point Tatatunga (hero2) at `/models/Untitled4.fbx` (user's latest export).
UPDATE heroes SET model_path = '/models/Untitled4.fbx' WHERE slug = 'tatatunga';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/Untitled4.fbx'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';
