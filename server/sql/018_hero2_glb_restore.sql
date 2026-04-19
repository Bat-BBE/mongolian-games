-- Map / hero select: Tatatunga back to legacy GLB (avoid new FBX on map).
UPDATE heroes SET model_path = '/models/hero2.glb' WHERE slug = 'tatatunga';

UPDATE app_users
SET profile = jsonb_set(
      COALESCE(profile, '{}'::jsonb),
      '{heroModelPath}',
      to_jsonb('/models/hero2.glb'::text),
      true
    )
WHERE profile ->> 'heroId' = 'tatatunga';
