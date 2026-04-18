-- Repoint hero `model_path` entries at the new GLB assets. The previous
-- FBX paths (hero-2.fbx, "X Bot.fbx") are now obsolete and have been replaced
-- by dedicated GLB models for each of the four heroes.
UPDATE heroes SET model_path = '/models/hero1.glb' WHERE slug = 'shikhikhutag';
UPDATE heroes SET model_path = '/models/hero2.glb' WHERE slug = 'tatatunga';
UPDATE heroes SET model_path = '/models/hero3.glb' WHERE slug = 'subutai';
UPDATE heroes SET model_path = '/models/hero4.glb' WHERE slug = 'rashid';
