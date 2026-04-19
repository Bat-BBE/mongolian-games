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
    'Зэндмэнэ: 60 мод (гар 12, газар 48), ахалтын дараалал, жин, тэгш тоотойд гэр, сондгойд цай хураах. Тоглоом дотор дүрмийн дэлгэц.',
    'Zendmene (Khorol): 60 pieces, strength order, trump (jin), team gers or tea scoring for odd counts. In-app rules screen.',
    false,
    4
  ),
  (
    'puzzle',
    'Хос ол',
    'Memory Pairs',
    'Санах ой, анхаарал, логик шаардсан тоглоом: 4×4 талбарт нуугдсан шагайн талыг хос болгон илрүүлнэ. Хугацаа дуусахаас өмнө бүх хосыг таа.',
    'A logic and memory game: reveal pairs of traditional shagai sides on a 4×4 grid. Match all pairs before time runs out.',
    true,
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
  ),
  (
    'horse-race',
    'Шагайн морь уралдах',
    'Shagai Horse Race',
    'Шагайгаар мори уралдуулдаг уламжлалт тоглоом. 4 шагай шидэж морь буусан тоогоороо өөрийн мориноос 20 шагайт замаар урагш ахиулж, роботыг хожих.',
    'A traditional Mongolian horse racing game played with shagai. Throw 4 shagai and advance your racer by the number of horse-landed sides, reaching the finish before the robot.',
    true,
    8
  ),
  (
    'shagai-guess',
    'Шагай таалцах',
    'Shagai Guess',
    'Хоёр тал ижил тоотой шагай хуваан авч, тойрог бүрд нуугдсан шагайныхаа зөв тоог таах тоглоом. Зөв таасан тал нуугдсан шагайг нь авна. Эхлээд шагайгаа хожигдсөн хэсэг хасагдана.',
    'A traditional Mongolian guessing game. Both sides start with the same number of shagai, secretly hide some in their fist, and guess the combined hidden total. The correct guesser takes the shagai from the loser; the side that collects every shagai wins.',
    true,
    9
  )
ON CONFLICT (slug) DO NOTHING;
