-- Heroes, map stations (уртуу), UI strings for dashboard sidebar — admin-managed.

CREATE TABLE IF NOT EXISTS heroes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_mn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  title_mn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'C',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  color TEXT NOT NULL,
  emissive TEXT,
  image_url TEXT NOT NULL,
  model_path TEXT,
  bonus_multiplier TEXT NOT NULL DEFAULT 'x1.5',
  bonus_title_mn TEXT,
  bonus_title_en TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_heroes_sort ON heroes (sort_order);

CREATE TABLE IF NOT EXISTS map_stations (
  slug TEXT PRIMARY KEY,
  name_mn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  region_mn TEXT NOT NULL,
  region_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📍',
  pos JSONB NOT NULL DEFAULT '{}'::jsonb,
  journey_index INT NOT NULL,
  quest_hint_mn TEXT,
  quest_hint_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_stations_journey ON map_stations (journey_index);

CREATE TABLE IF NOT EXISTS ui_strings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('mn', 'en')),
  value TEXT NOT NULL,
  UNIQUE (key, locale)
);

INSERT INTO heroes (
  slug, name_mn, name_en, title_mn, title_en, tier, stats, color, emissive, image_url, model_path,
  bonus_multiplier, bonus_title_mn, bonus_title_en, sort_order, is_available
)
VALUES
  (
    'shikhikhutag',
    'Шихихутаг',
    'Shikhikhutag',
    'Хаадын Зөвлөх',
    'The Judge',
    'C',
    '{"wisdom":90,"strength":60,"speed":70}'::jsonb,
    '#ffd559',
    '#D4AF37',
    '/images/shikhikhutag.png',
    '/models/hero-2.fbx',
    'x1.5',
    'Талын Хурд',
    'Steppe Speedster',
    0,
    true
  ),
  (
    'tatatunga',
    'Тататунга',
    'Tatatunga',
    'Бичгийн Эзэн',
    'The Scribe',
    'C',
    '{"wisdom":95,"strength":40,"speed":55}'::jsonb,
    '#00A3E0',
    '#00c0ff',
    '/images/tatatunga.png',
    '/models/X Bot.fbx',
    'x1.5',
    'Талын Хурд',
    'Steppe Speedster',
    1,
    true
  ),
  (
    'subutai',
    'Сүбэдэй',
    'Subutai',
    'Дайны Баатар',
    'The General',
    'C',
    '{"wisdom":70,"strength":95,"speed":85}'::jsonb,
    '#C0392B',
    '#e04030',
    '/images/subutai.png',
    '/models/X Bot.fbx.fbx',
    'x1.5',
    'Талын Хурд',
    'Steppe Speedster',
    2,
    true
  ),
  (
    'rashid',
    'Рашид',
    'Rashid-al-Din',
    'Түүхч Эрдэмтэн',
    'The Historian',
    'C',
    '{"wisdom":85,"strength":50,"speed":60}'::jsonb,
    '#9B59B6',
    '#b070d0',
    '/images/rashid.png',
    '/models/X Bot.fbx',
    'x1.5',
    'Талын Хурд',
    'Steppe Speedster',
    3,
    true
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO map_stations (
  slug, name_mn, name_en, region_mn, region_en, icon, pos, journey_index, quest_hint_mn, quest_hint_en
)
VALUES
  ('choibalsan', 'Хэрлэн Тохой', 'Choibalsan', 'Хэрлэн Тохой', 'Choibalsan', '🐎', '{"left":"85%","top":"40%","wx":538,"wz":-88}'::jsonb, 0, 'Хэрлэн Тохой — аяллын зорилт.', 'Objective near Choibalsan.'),
  ('kherlenbayan', 'Аврага Тосгон', 'Kherlenbayan', 'Аврага Тосгон', 'Kherlenbayan', '🌾', '{"left":"75%","top":"44%","wx":362,"wz":-38}'::jsonb, 1, 'Аврага Тосгон — аяллын зорилт.', 'Objective near Kherlenbayan.'),
  ('baruun_urt', 'Дадал', 'Baruun-Urt', 'Дадал', 'Baruun-Urt', '🏕️', '{"left":"76%","top":"53%","wx":388,"wz":75}'::jsonb, 2, 'Дадал — аяллын зорилт.', 'Objective near Baruun-Urt.'),
  ('ondorhaan', 'Бурхан Халдун', 'Öndörkhaan', 'Бурхан Халдун', 'Öndörkhaan', '⛰️', '{"left":"68%","top":"42%","wx":238,"wz":-62}'::jsonb, 3, 'Бурхан Халдун — аяллын зорилт.', 'Objective near Öndörkhaan.'),
  ('terelj', 'Арьяабал Хийд', 'Terelj', 'Арьяабал Хийд', 'Terelj', '🦅', '{"left":"59%","top":"41%","wx":130,"wz":-90}'::jsonb, 4, 'Арьяабал Хийд — аяллын зорилт.', 'Objective near Terelj.'),
  ('nalaikh', 'Нялга Агуй', 'Nalaikh', 'Нялга Агуй', 'Nalaikh', '🪨', '{"left":"58%","top":"46%","wx":100,"wz":-10}'::jsonb, 5, 'Нялга Агуй — аяллын зорилт.', 'Objective near Nalaikh.'),
  ('ulaanbaatar', 'Богд Хан Ордон', 'Ulaanbaatar', 'Богд Хан Ордон', 'Ulaanbaatar', '🏙️', '{"left":"55%","top":"45%","wx":0,"wz":0}'::jsonb, 6, 'Богд Хан Ордон — аяллын зорилт.', 'Objective near Ulaanbaatar.'),
  ('zuunmod', 'Манзушир Хийд', 'Zuunmod', 'Манзушир Хийд', 'Zuunmod', '🛕', '{"left":"55%","top":"49%","wx":0,"wz":80}'::jsonb, 7, 'Манзушир Хийд — аяллын зорилт.', 'Objective near Zuunmod.'),
  ('mandalgovi', 'Онгийн Хийд', 'Mandalgovi', 'Онгийн Хийд', 'Mandalgovi', '🕌', '{"left":"57%","top":"63%","wx":20,"wz":230}'::jsonb, 8, 'Онгийн Хийд — аяллын зорилт.', 'Objective near Mandalgovi.'),
  ('sainshand', 'Хамарын Хийд', 'Sainshand', 'Хамарын Хийд', 'Sainshand', '🕌', '{"left":"68%","top":"68%","wx":238,"wz":263}'::jsonb, 9, 'Хамарын Хийд — аяллын зорилт.', 'Objective near Sainshand.'),
  ('zamiin_uud', 'Их Газрын Чулуу', 'Zamiin-Uud', 'Их Газрын Чулуу', 'Zamiin-Uud', '🪨', '{"left":"72%","top":"78%","wx":312,"wz":388}'::jsonb, 10, 'Их Газрын Чулуу — аяллын зорилт.', 'Objective near Zamiin-Uud.'),
  ('sukhbaatar', 'Алтан Булаг', 'Sükhbaatar (city)', 'Алтан Булаг', 'Sükhbaatar (city)', '🏰', '{"left":"52%","top":"27%","wx":-45,"wz":-250}'::jsonb, 11, 'Алтан Булаг — аяллын зорилт.', 'Objective near Sükhbaatar (city).'),
  ('darkhan', 'Хустайн Нуруу', 'Darkhan', 'Хустайн Нуруу', 'Darkhan', '🐴', '{"left":"51%","top":"33%","wx":-62,"wz":-175}'::jsonb, 12, 'Хустайн Нуруу — аяллын зорилт.', 'Objective near Darkhan.'),
  ('erdenet', 'Амарбаясгалант Хийд', 'Erdenet', 'Амарбаясгалант Хийд', 'Erdenet', '🛕', '{"left":"46%","top":"35%","wx":-150,"wz":-150}'::jsonb, 13, 'Амарбаясгалант Хийд — аяллын зорилт.', 'Objective near Erdenet.'),
  ('kharakhorum', 'Эрдэнэзуу Хийд', 'Karakorum', 'Эрдэнэзүү Хийд', 'Karakorum', '🏛️', '{"left":"43%","top":"48%","wx":-200,"wz":12}'::jsonb, 14, 'Эрдэнэзүү Хийд — аяллын зорилт.', 'Objective near Karakorum.'),
  ('orkhon_river', 'Орхоны Хөндий', 'Orkhon Valley', 'Орхоны Хөндий', 'Orkhon Valley', '🌊', '{"left":"40%","top":"41%","wx":-238,"wz":-90}'::jsonb, 15, 'Орхоны Хөндий — аяллын зорилт.', 'Objective near Orkhon Valley.'),
  ('arvaikheer', 'Цагаан Суварга', 'Arvaikheer', 'Цагаан Суварга', 'Arvaikheer', '🗿', '{"left":"44%","top":"54%","wx":-188,"wz":130}'::jsonb, 16, 'Цагаан Суварга — аяллын зорилт.', 'Objective near Arvaikheer.'),
  ('moron', 'Дэлгэр Мөрөн', 'Mörön', 'Дэлгэр Мөрөн', 'Mörön', '🌊', '{"left":"34%","top":"28%","wx":-350,"wz":-238}'::jsonb, 17, 'Дэлгэр Мөрөн — аяллын зорилт.', 'Objective near Mörön.'),
  ('khatgal', 'Хөвсгөл Нуур', 'Khatgal', 'Хөвсгөл Нуур', 'Khatgal', '🏞️', '{"left":"33%","top":"21%","wx":-375,"wz":-325}'::jsonb, 18, 'Хөвсгөл Нуур — аяллын зорилт.', 'Objective near Khatgal.'),
  ('bayankhongor', 'Яхын Нуур', 'Bayankhongor', 'Яхын Нуур', 'Bayankhongor', '🦌', '{"left":"35%","top":"58%","wx":-350,"wz":138}'::jsonb, 19, 'Яхын Нуур — аяллын зорилт.', 'Objective near Bayankhongor.'),
  ('uliastai', 'Отгонтэнгэр Уул', 'Uliastai', 'Отгонтэнгэр Уул', 'Uliastai', '🏔️', '{"left":"26%","top":"40%","wx":-525,"wz":-88}'::jsonb, 20, 'Отгонтэнгэр Уул — аяллын зорилт.', 'Objective near Uliastai.'),
  ('dalanzadgad', 'Хонгорын Элс', 'Dalanzadgad', 'Хонгорын Элс', 'Dalanzadgad', '🦖', '{"left":"48%","top":"75%","wx":-112,"wz":350}'::jsonb, 21, 'Хонгорын Элс — аяллын зорилт.', 'Objective near Dalanzadgad.'),
  ('altai', 'Алтайн Нуруу', 'Altai', 'Алтайн Нуруу', 'Altai', '⛰️', '{"left":"21%","top":"55%","wx":-600,"wz":100}'::jsonb, 22, 'Алтайн Нуруу — аяллын зорилт.', 'Objective near Altai.'),
  ('ulaangom', 'Увс Нуур', 'Ulaangom', 'Увс Нуур', 'Ulaangom', '🌊', '{"left":"14%","top":"26%","wx":-712,"wz":-263}'::jsonb, 23, 'Увс Нуур — аяллын зорилт.', 'Objective near Ulaangom.'),
  ('khovd', 'Буянт Ухаа', 'Khovd', 'Буянт Ухаа', 'Khovd', '🦅', '{"left":"12%","top":"48%","wx":-750,"wz":12}'::jsonb, 24, 'Буянт Ухаа — аяллын зорилт.', 'Objective near Khovd.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO ui_strings (key, locale, value) VALUES
  ('sidebar.currentExpedition', 'mn', 'Одоогийн Өртөө'),
  ('sidebar.mainQuest', 'mn', 'Үндсэн Даалгавар'),
  ('sidebar.questTitle', 'mn', 'Талын Элч'),
  ('sidebar.questDesc', 'mn', 'Орхоны хөндийг гатлан Их Хааны тамгыг хүргэх. Өөрчлөгдөх салхинаас болгоомжил.'),
  ('sidebar.continueJourney', 'mn', 'Аяллыг Үргэлжлүүлэх'),
  ('sidebar.treasury', 'mn', 'Эрдэнэс'),
  ('sidebar.rank', 'mn', 'Зэрэг Дэвших'),
  ('sidebar.rankTitle', 'mn', 'Элч'),
  ('sidebar.leaderboard', 'mn', 'Жагсаалт'),
  ('sidebar.activeBonus', 'mn', 'Идэвхтэй Оноо'),
  ('sidebar.journeyDayLabel', 'mn', 'Аяллын өдөр'),
  ('sidebar.topPlayersLabel', 'mn', 'Топ тоглогчид'),
  ('sidebar.urtuuCounter', 'mn', 'Өртөө'),
  ('sidebar.currentExpedition', 'en', 'Current Expedition'),
  ('sidebar.mainQuest', 'en', 'Main Quest'),
  ('sidebar.questTitle', 'en', 'The Steppe Messenger'),
  ('sidebar.questDesc', 'en', 'Crossing the Orkhon Valley to deliver the seal of the Great Khan. Beware of the changing winds.'),
  ('sidebar.continueJourney', 'en', 'Continue Journey'),
  ('sidebar.treasury', 'en', 'Treasury'),
  ('sidebar.rank', 'en', 'Rank Progression'),
  ('sidebar.rankTitle', 'en', 'Messenger'),
  ('sidebar.leaderboard', 'en', 'Leaderboard'),
  ('sidebar.activeBonus', 'en', 'Active Relay Bonus'),
  ('sidebar.journeyDayLabel', 'en', 'Journey day'),
  ('sidebar.topPlayersLabel', 'en', 'Top Players'),
  ('sidebar.urtuuCounter', 'en', 'Station')
ON CONFLICT (key, locale) DO NOTHING;
