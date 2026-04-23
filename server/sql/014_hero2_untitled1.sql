UPDATE heroes SET model_path = '/models/Untitled1.fbx' WHERE slug = 'tatatunga';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/Untitled1.fbx'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';
