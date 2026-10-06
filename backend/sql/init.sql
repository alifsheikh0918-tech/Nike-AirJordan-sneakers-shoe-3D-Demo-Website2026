CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS sneakers (
  id SERIAL PRIMARY KEY, brand TEXT NOT NULL CHECK (brand IN ('Nike','Jordan')),
  name TEXT NOT NULL, colorway TEXT, release_date DATE, price_usd INT, accent TEXT DEFAULT '#ff6a3d');
CREATE INDEX IF NOT EXISTS sneakers_release_idx ON sneakers (release_date);
-- Sources: Sneaker News, Sole Retriever, Sneaker Files, Just Fresh Kicks, Nice Kicks (checked 2026-10-06).
-- Dates and prices change often. NULL price = not confirmed. Re-check before launch.
INSERT INTO sneakers (brand,name,colorway,release_date,price_usd,accent) VALUES
('Jordan','Air Jordan 3 "Black Cat"','Black / Dark Charcoal','2025-01-11',200,'#f2b705'),
('Jordan','Air Jordan 6 "Doernbecher"',NULL,'2025-01-25',200,'#3aa0ff'),
('Jordan','Air Jordan 3 "Valentine''s Day"',NULL,'2025-02-01',215,'#ff4f7a'),
('Jordan','Air Jordan 5 "Black Metallic Reimagined"','Black / Metallic','2025-02-08',210,'#9aa4b8'),
('Jordan','Air Jordan 1 High ''85 "Bred"','Black / Red','2025-02-14',250,'#e0262d'),
('Nike','Nike SB Dunk Low Pro "Black and Aluminum"','Black / Aluminum','2025-02-19',115,'#8fa0b3'),
('Jordan','Air Jordan 1 Low OG "Sail"','Sail / University Red','2026-06-06',145,'#d9363e'),
('Jordan','Air Jordan 13 "Flint"',NULL,'2026-08-01',NULL,'#5b7cff'),
('Jordan','Air Jordan 6 "Oreo"',NULL,'2026-08-08',NULL,'#e8edf5'),
('Jordan','Air Jordan 8 "Chrome"',NULL,'2026-08-29',NULL,'#b8c4d6'),
('Jordan','Air Jordan 4 "Tour Yellow"','White / Dark Blue Grey / Tour Yellow','2026-09-05',220,'#ffd21f'),
('Jordan','Air Jordan 3 TD "Metallic Silver"','Metallic Silver','2026-09-10',205,'#c0c8d8'),
('Nike','Nike Dunk Low "Campfire Orange"','Campfire Orange / Black','2026-10-01',120,'#ff7a1a'),
('Jordan','Air Jordan 16 "Black Pack"','Black / Off Noir','2026-10-03',245,'#6b6f80'),
('Nike','Nike Air Force 1 Low ''01 "Victor Victor Yellow Zest"','Yellow Zest','2026-10-03',150,'#e8ff3a'),
('Jordan','Air Jordan 1 High OG "Royal"','Black / Royal / White','2026-10-10',185,'#2f5bff'),
('Jordan','Air Jordan 5 "Halloween"','Black / Multi-Color','2026-10-17',215,'#ff6a1a'),
('Nike','Nike Air Force 1 Low "NYC Rat"',NULL,'2026-10-23',NULL,'#9aa0a6'),
('Jordan','Air Jordan 12 "Fireside"',NULL,'2026-10-24',NULL,'#ff8a3d'),
('Nike','Nike Air Force 1 Low "Ghostface"',NULL,'2026-10-24',NULL,'#f0f0f0'),
('Nike','Nike Air Max 95 "Reverse Blue Spark"',NULL,'2026-10-24',NULL,'#2fb8ec'),
('Jordan','Air Jordan 41 "University Red"','University Red / Infrared 23','2026-10-25',205,'#ff2d3d'),
('Jordan','Air Jordan 14 "Forest Green"','Gorge Green / Light Graphite / White','2026-10-31',215,'#1f8f5a'),
('Jordan','Air Jordan 15 "Black Pack"','Black / Off Noir','2026-11-07',240,'#5a5f73'),
('Jordan','Air Jordan 6 OG "White Infrared"','White / Infrared','2026-11-07',NULL,'#ff3b30'),
('Jordan','Air Jordan 11 "Green Screen"','Multi-Color / Gym Green','2026-11-14',255,'#22c55e'),
('Nike','Nike Air Max 95 "ACG"',NULL,'2026-11-20',NULL,'#7a8450'),
('Nike','Nike Air Force 1 Low Pony Hair "Team Red"','Team Red','2026-11-21',NULL,'#d3202a'),
('Jordan','Air Jordan 4 "Bred" OG','Black / Red','2026-11-27',NULL,'#e0262d'),
('Nike','Nike SB Dunk Low "Green Patent"','Green Patent','2026-11-28',NULL,'#1fa84f'),
('Jordan','Air Jordan 10 OG "Sacramento"',NULL,'2026-12-05',NULL,'#c53030'),
('Jordan','Air Jordan 11 "Space Jam"','Black / Concord / White','2026-12-12',235,'#5b3fd0'),
('Jordan','Air Jordan 8 "Knicks"','Black / Racer Blue / Safety Orange','2026-12-24',215,'#ff7a1a'),
('Jordan','Air Jordan 3 "Middle East"','Soft Pearl / Mink Brown / Pomegranate','2026-12-31',215,'#b5835a');
