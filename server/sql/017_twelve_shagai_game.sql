INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES (
  'twelve-shagai',
  '12 жил (шагай)',
  '12 years (shagai)',
  '2 тоглогч ээлжлэн 2–4 шагай шидаж, гарсан морь бүр 1 оноо; анхны 12 морины оноо хүрсэн нь хожино.',
  'Two players take turns throwing 2–4 shagai; each horse face scores 1 point. First to 12 horse points wins.',
  true,
  11
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+250 МО', '+250 XP'
FROM map_stations s
JOIN games g ON g.slug = 'twelve-shagai'
ON CONFLICT (station_slug, game_id) DO NOTHING;
