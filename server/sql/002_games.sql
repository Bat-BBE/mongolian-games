-- Catalog of traditional games (MN/EN copy + slug for GameModal routing).

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_mn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_mn TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_sort ON games (sort_order);

INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES
  (
    'shagai',
    'Шагайн наадгай',
    'Shagai Shooting',
    'Хонины шагайгаар тоглодог Монголын хамгийн түгээмэл тоглоом. Нарийвчлал, авхаалж самбаа шаарддаг.',
    'One of the most popular Mongolian games played with sheep ankle bones.',
    true,
    0
  ),
  (
    'alag-melkhii',
    'Алаг мэлхий өрөх',
    'Alag Melkhii',
    'Шагайгаар мэлхийн дүрс үүсгэн өрж тоглодог уламжлалт тоглоом.',
    'A traditional board game where ankle bones are arranged in the shape of a turtle.',
    false,
    1
  ),
  (
    'four-bones',
    'Дөрвөн бэрх',
    'Four Bones',
    'Шагай орхиж аз хийморь шинждэг уламжлалт наадгай.',
    'A luck-based ankle bone game used to predict fortune.',
    true,
    2
  ),
  (
    'uichuur',
    'Үйчүүр',
    'Uichuur',
    'Монголын эртний хөзрийн төрлийн тоглоом бөгөөд стратеги, багаар тоглох ур чадвар шаарддаг.',
    'An ancient Mongolian strategic card game played in teams.',
    false,
    3
  ),
  (
    'khorol',
    'Хорол',
    'Khorol',
    'Монголчуудын уламжлалт хөлөгт тоглоом бөгөөд стратеги, хамтын ажиллагааг хөгжүүлдэг.',
    'A traditional Mongolian board strategy game.',
    false,
    4
  ),
  (
    'puzzle',
    'Оньсон тоглоом',
    'Puzzle Locks',
    'Оюун ухаан сорих модон оньс тайлах уламжлалт тоглоом.',
    'Traditional wooden puzzle games that challenge logical thinking.',
    false,
    5
  ),
  (
    'teveg',
    'Тэвэг өшиглөх',
    'Teveg',
    'Хүүхдүүдийн дунд түгээмэл тоглодог гар хөлний зохицол шаардсан тоглоом.',
    'A traditional shuttle-kick game played mostly by children.',
    false,
    6
  ),
  (
    'stone-guess',
    'Чулуу таах',
    'Stone Guessing',
    'Сэтгэхүй, анхаарал төвлөрөл шаардсан энгийн боловч сонирхолтой уламжлалт тоглоом.',
    'A simple but engaging guessing game that improves attention and memory.',
    true,
    7
  )
ON CONFLICT (slug) DO NOTHING;
