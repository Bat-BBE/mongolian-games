INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES
  (
    'wooden-dice',
    'Модон шоо',
    'Wooden dice duel',
    'Мод, ноосон дэвсгэр дээр гурван жижиг модон шоо шидаж, гурвын нийлбэриэр ээлжит өргөөд уралддаг. 5 оноо. Ганцаар эсвэл 2 тоглогч.',
    'Three carved wooden dice on felt—sum your roll each round, higher total wins the round, first to 5. Solo or two players online (host rolls both sides for sync).',
    true,
    12
  ),
  (
    'stone-cairn',
    'Чулуун овоо',
    'Stone cairn memory',
    'Тал дээрх 5 чулуун — дарааллыг санаж давтах. Алхам бүрт нэг чулуу нэмнэ. 10 алхам амжилт. Ганцаар эсвэл 2 тоглогч ижил санаанд (match seed) өрсөлдөнө.',
    'Five cairn stones in 3D: watch the light pattern, then repeat. Each level adds a step—reach 10 to win, or outscore a friend in 2P with the same seeded sequence.',
    true,
    13
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO station_games (station_slug, game_id, sort_order, reward_hint_mn, reward_hint_en)
SELECT s.slug, g.id, g.sort_order, '+200 МО', '+200 XP'
FROM map_stations s
JOIN games g ON g.slug IN ('wooden-dice', 'stone-cairn')
ON CONFLICT (station_slug, game_id) DO NOTHING;
