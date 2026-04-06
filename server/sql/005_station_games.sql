-- Өртөө бүрт ямар тоглоомууд байгааг холбоно (admin-аас засварлана).

CREATE TABLE IF NOT EXISTS station_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_slug TEXT NOT NULL REFERENCES map_stations (slug) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  reward_hint_mn TEXT NOT NULL DEFAULT '',
  reward_hint_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (station_slug, game_id)
);

CREATE INDEX IF NOT EXISTS idx_station_games_station ON station_games (station_slug);
CREATE INDEX IF NOT EXISTS idx_station_games_game ON station_games (game_id);

-- Жишээ: УБ өртөөнд нэг тоглоом холбох (байвал л)
INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT 'ulaanbaatar', g.id, 0, '+250 МО', '+250 KP'
FROM games g
WHERE g.slug = 'shagai'
ON CONFLICT (station_slug, game_id) DO NOTHING;
