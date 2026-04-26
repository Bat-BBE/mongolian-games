INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES (
  'berkh-12-shagai',
  '12 бэрх (шагайн наадгай)',
  '12 Berkh (shagai party)',
  '2–4 тоглогч ээлжлэн 12 шагай шида. Морь: төвөөс, тэмээ: эсрэг нар. Төлж чадахгүй бол хасагдана; хамгийн олон морь эсвэл сүүлийнх эсвэл 48 бүгдийг авсан — хожино.',
  '2–4 players, 12 shagai per throw. Horses: from the pot. Camels: pay counter-sun. Most mories, last in, or all 48 — to win.',
  true,
  12
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+250 МО', '+250 XP'
FROM map_stations s
JOIN games g ON g.slug = 'berkh-12-shagai'
ON CONFLICT (station_slug, game_id) DO NOTHING;
