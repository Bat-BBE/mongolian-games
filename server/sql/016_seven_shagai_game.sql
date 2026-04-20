-- Solo “seven shagai” pairing game (digital ньсрэх).

INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES (
  'seven-shagai',
  'Долоон шагай',
  'Seven Shagai',
  'Долоон шагай шидээд ижил тал харагдаж буй хосуудыг дараалан сонгоно. Бүх хосыг зөв сонгож дуусгах эсвэл нэг шагай л үлдвэл хожино. Өөр талтай хос сонговол эсвэл цааш хос гаргах боломжгүй бол хожигдоно.',
  'Throw seven bones, then repeatedly pick two that show the same face. Clear every pair—or end with a single lucky bone—to win. A mismatched pick or a dead-end layout loses.',
  true,
  10
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+250 МО', '+250 XP'
FROM map_stations s
JOIN games g ON g.slug = 'seven-shagai'
ON CONFLICT (station_slug, game_id) DO NOTHING;
