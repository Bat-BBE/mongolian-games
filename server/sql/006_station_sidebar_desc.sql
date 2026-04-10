-- Add per-station sidebar quest description (dynamic per station).

ALTER TABLE map_stations ADD COLUMN IF NOT EXISTS quest_desc_mn TEXT;
ALTER TABLE map_stations ADD COLUMN IF NOT EXISTS quest_desc_en TEXT;

