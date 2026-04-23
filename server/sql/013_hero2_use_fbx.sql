UPDATE heroes SET model_path = '/models/hero2.fbx' WHERE slug = 'tatatunga';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero2.fbx'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';
