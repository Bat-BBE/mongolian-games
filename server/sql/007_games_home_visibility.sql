-- Games visibility: show on landing page vs station-only.

ALTER TABLE games ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true;

