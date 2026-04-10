-- Hero short bio/description (admin editable).

ALTER TABLE heroes ADD COLUMN IF NOT EXISTS bio_mn TEXT;
ALTER TABLE heroes ADD COLUMN IF NOT EXISTS bio_en TEXT;

