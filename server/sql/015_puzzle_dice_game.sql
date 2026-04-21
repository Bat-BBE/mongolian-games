UPDATE games
SET
  name_mn = 'Хос ол',
  name_en = 'Memory Pairs',
  description_mn = 'Санах ой, анхаарал, логик шаардсан тоглоом: 4×4 талбарт нуугдсан шагайн талыг хос болгон илрүүлнэ. Хугацаа дуусахаас өмнө бүх хосыг таа.',
  description_en = 'A logic and memory game: reveal pairs of traditional shagai sides on a 4×4 grid. Match all pairs before time runs out.',
  is_available = true,
  updated_at = now()
WHERE slug = 'puzzle';

INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+200 МО', '+200 XP'
FROM map_stations s
JOIN games g ON g.slug = 'puzzle'
ON CONFLICT (station_slug, game_id) DO NOTHING;
