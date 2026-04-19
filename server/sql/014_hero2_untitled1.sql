-- Replace the Tatatunga hero's model with the re-exported
-- `/models/Untitled1.fbx`. The previous `hero2.fbx` shipped with a
-- broken texture reference (the exporter named the diffuse slot but
-- didn't embed the pixel data, so the mesh rendered pitch-black in the
-- browser). Untitled1.fbx is the user's replacement export.
UPDATE heroes SET model_path = '/models/Untitled1.fbx' WHERE slug = 'tatatunga';

-- Migrate cached profiles that reference either of the previous paths.
UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/Untitled1.fbx'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';
