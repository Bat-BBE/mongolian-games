-- Газрын зураг дээрх «оньсого» цэгүүд (өртөөнөөс тусдаа). Админоос удирдана.

CREATE TABLE IF NOT EXISTS map_onisogo (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  wx         INTEGER NOT NULL,
  wz         INTEGER NOT NULL,
  icon       TEXT NOT NULL DEFAULT '❓',
  title_mn   TEXT NOT NULL,
  title_en   TEXT NOT NULL,
  question_mn TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_correct_mn TEXT NOT NULL,
  answer_correct_en TEXT NOT NULL,
  wrong_1_mn TEXT NOT NULL,
  wrong_1_en TEXT NOT NULL,
  wrong_2_mn TEXT NOT NULL,
  wrong_2_en TEXT NOT NULL,
  wrong_3_mn TEXT NOT NULL,
  wrong_3_en TEXT NOT NULL,
  coin_reward INTEGER NOT NULL DEFAULT 18,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_onisogo_active_sort ON map_onisogo (is_active, sort_order);

-- Эхний 10 оньсого (жишээ агуулга — админоос өөрчилж болно)
INSERT INTO map_onisogo (
  slug, wx, wz, icon, title_mn, title_en,
  question_mn, question_en,
  answer_correct_mn, answer_correct_en,
  wrong_1_mn, wrong_1_en, wrong_2_mn, wrong_2_en, wrong_3_mn, wrong_3_en,
  coin_reward, sort_order
) VALUES
(
  'oni_shagai',
  72, 58, '🎲',
  'Оньсого — шагай', 'Riddle — shagai',
  E'Босговол борхон ботго\nЭргүүлбэл эмнэг даага\nХэвтүүлбэл хөөрхөн хурга\nХөмөрвөл хөх ишиг\nТэр юу вэ?',
  E'Fallen: a spotted kid.\nTurned: a lone foal.\nLaid flat: a cute lamb.\nTilted: a blue-gray kid.\nWhat is it?',
  'Шагай', 'Shagai (ankle bones)',
  'Чулуу', 'Stone', 'Янзага', 'Dice', 'Тоглоом', 'Toy'
  , 22, 1
),
(
  'oni_buga',
  -78, 92, '🦌',
  'Оньсого — буга', 'Riddle — deer',
  E'Алаг цоохор дээлийг чив гэтэл өмсөөд\nАгар зандан модыг орой дээрээ шүтээд\nАглаг хангайгаар нутаглах дуртай\nАсар гоёмсог авгайг хэн гэж нэрлэх вэ?',
  E'Speckled coat like a deel,\nAntlers like branching wood,\nLoves the forested Khangai —\nwhat do we call this graceful lady?',
  'Буга', 'Deer (maral)',
  'Хярс', 'Roe deer', 'Зээр', 'Gazelle', 'Агь', 'Ibex'
  , 20, 2
),
(
  'oni_zeer',
  105, -140, '🐐',
  'Оньсого — зээр', 'Riddle — goitered gazelle',
  E'Галбын говиор нутагтай\nГадсан шовгор малгайтай\nМэнэнгийн говиор нутагтай\nМэтгэр гадсан малгайтай',
  E'From Galbin Gobi lands,\nwith a steep, sharp “hat”,\nfrom Menen Gobi too —\nwho wears that sharp cap?',
  'Зээр', 'Goitered gazelle',
  'Антилоп', 'Antelope', 'Янгир', 'Argali', 'Ингэ', 'Mare'
  , 20, 3
),
(
  'oni_baavgai',
  -210, 40, '🐻',
  'Оньсого — баавгай', 'Riddle — bear',
  E'Нүүлийн цаана\nНүгэлтэй чөтгөр\nНүд амандаа\nГалтай чөтгөр',
  E'Behind the rump,\na “sinful” spirit,\neyes in its mouth,\na fiery devil — who?',
  'Баавгай', 'Bear',
  'Чоно', 'Wolf', 'Гахай', 'Boar', 'Сармагчин', 'Monkey'
  , 22, 4
),
(
  'oni_bar',
  280, -200, '🐅',
  'Оньсого — бар', 'Riddle — tiger',
  E'Буруу ташаа суудалтай\nБурхан ламын байдалтай\nТэнгэрийн цолмон нүдтэй\nТэмээн халиун зүстэй',
  E'Crooked seat, saintly poise,\nheaven-bright eyes,\ncamel-striped coat — who is this?',
  'Бар', 'Tiger',
  'Ирвэс', 'Leopard', 'Шилүүс', 'Lynx', 'Чоно', 'Wolf'
  , 24, 5
),
(
  'oni_uneg',
  -320, 180, '🦊',
  'Оньсого — үнэг', 'Riddle — fox',
  E'Алтан шаргал биетэй\nАлиа шалиг ааштай\nЗаль мэх ихтэй\nЗайдуу хөндийд нутагтай',
  E'Golden-reddish coat,\nplayful, tricky ways,\nlives in the open distance — who?',
  'Үнэг', 'Fox',
  'Чоно', 'Wolf', 'Ингэ', 'Mare', 'Янгир', 'Argali'
  , 18, 6
),
(
  'oni_mori',
  500, -95, '🏇',
  'Оньсого — морь', 'Riddle — horse',
  E'Алтан дэлэн дээр гүйлгэнэ\nАлдарт наадамд уралдана\nАйлын харваанд тулгуур болно\nАмьдралын замд хамт явна',
  E'Runs on the golden steppe,\nraces at the great festival,\ncarries the household — who?',
  'Морь', 'Horse',
  'Тэмэ', 'Camel', 'Үхэр', 'Ox', 'Ингэ', 'Mare'
  , 16, 7
),
(
  'oni_temee',
  95, 285, '🐪',
  'Оньсого — тэмэ', 'Riddle — camel',
  E'Хоёр бөхтэй, хөлд тэсвэртэй\nХатуу ширүүн цөлийг туулна\nАчаа тээн замыг үргэлжлүүлнэ\nХүний найз нөхөр цөлд',
  E'Two humps, tough feet,\ncrosses harsh desert,\ncarries the load — who?',
  'Тэмэ', 'Camel',
  'Морь', 'Horse', 'Ингэ', 'Mare', 'Хонь', 'Sheep'
  , 16, 8
),
(
  'oni_chono',
  -150, -220, '🐺',
  'Оньсого — чоно', 'Riddle — wolf',
  E'Саран дор улирана\nСүрэг малыг дагана\nСэрэмжтэй, хурдан, зальтай\nСтепийн дээрэнгүй анчин',
  E'Howls beneath the moon,\nfollows herds,\nsharp and clever hunter — who?',
  'Чоно', 'Wolf',
  'Нохой', 'Dog', 'Барс', 'Snow leopard', 'Үнэг', 'Fox'
  , 18, 9
),
(
  'oni_tuulai',
  190, 120, '🐇',
  'Оньсого — туулай', 'Riddle — hare',
  E'Урт чихтэй, хурдан үсрэнэ\nУлаан наранд нуугдана\nУргамал идэж амьдарна\nУулын өвстэй нутагт',
  E'Long ears, quick hops,\nhides in the sunlit grass,\nfeeds on plants — who?',
  'Туулай', 'Hare',
  'Морь', 'Horse', 'Хонь', 'Sheep', 'Ямаа', 'Goat'
  , 14, 10
)
ON CONFLICT (slug) DO NOTHING;
