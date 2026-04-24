INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES (
  'four-powers',
  'Дөрвөн эрхэ',
  'Clash of Four Powers',
  'Нүүдлийн амьдралаас сэдэвлэсэн дөрвөн сонголт: морь, тэмээ, үхэр, хонь — нэг нь нөгөөгөө дараалан дарна. Нэг өргөөнд бүгд нэгэн зэрэг сонгож, оноо цуглуулна. 7 оноогоор ялалт. 1–4 тоглогч (сулд бот) эсвэл ганцаар 3 боттой.',
  'A Mongolian-steppe themed simultaneous-pick game: horse, camel, ox, and sheep in a 4-way cycle. Everyone reveals each round; score to 7 to win. Play solo vs three bots, or 2–4 people online (bots fill empty seats).',
  true,
  11
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+210 МО', '+210 XP'
FROM map_stations s
JOIN games g ON g.slug = 'four-powers'
ON CONFLICT (station_slug, game_id) DO NOTHING;
