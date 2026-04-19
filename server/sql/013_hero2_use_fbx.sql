-- Repoint hero2 (Tatatunga) at the FBX model. The FBX ships with the
-- Mixamo-standard skeleton so walk/run clips in
-- `/public/models/standing *.fbx` can drive it once retargeted.
UPDATE heroes SET model_path = '/models/hero2.fbx' WHERE slug = 'tatatunga';

-- Backfill users who have the old /models/hero2.glb path cached on their
-- profile JSONB so existing sessions pick up the new model on next load.
UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero2.fbx'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';
