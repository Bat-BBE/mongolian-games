INSERT INTO games (slug, name_mn, name_en, description_mn, description_en, is_available, sort_order)
VALUES (
  'modon-onis',
  'Модон оньс',
  'Wooden Interlock',
  'Салангид модон хэсгүүдийг зөв байрлал, өнцөг, дарааллаар нийлүүлж бүтэн бүтцийг бүрдүүлнэ. Ойртвол ногоон зөвлөмж, буруу бол тавигдана.',
  'Assemble wooden pieces in the correct position, rotation, and order. Green ghost shows a valid snap; wrong overlaps are rejected.',
  true,
  11
)
ON CONFLICT (slug) DO NOTHING;
