-- Backfill: make sure every station has at least the available games assigned.
-- Previously only 'ulaanbaatar' had 'shagai' assigned, which caused
-- completeGame requests on other stations to fail with
-- "No games configured for station".

-- Assign every currently-available game to every station.
INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+250 МО', '+250 KP'
FROM map_stations s
CROSS JOIN games g
WHERE g.is_available = true
ON CONFLICT (station_slug, game_id) DO NOTHING;
