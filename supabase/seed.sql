-- ============================================================
-- TripSync — Test Seed Data for Thesis Demonstration
-- All users password: Tripsync2024!
--
-- Users:
--   test@tripsync.app   (Marc Yeste)    — main test account
--   ana@tripsync.app    (Ana García)    — collaborator
--   carlos@tripsync.app (Carlos López)  — collaborator
--   sofia@tripsync.app  (Sofía Martín)  — collaborator
--
-- Trips:
--   "Escapada a Roma"    — Apr 10-15 2026 (past) — Marc+Ana+Carlos
--   "Aventura en Japón"  — Jun 20-30 2026 (upcoming) — Marc+Ana+Sofía
-- ============================================================

-- ============================================================
-- PART 1: AUTH USERS + IDENTITIES + PROFILES
-- ============================================================

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  is_sso_user, is_anonymous, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, phone_change, phone_change_token,
  email_change_token_current, reauthentication_token
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'test@tripsync.app',
    crypt('Tripsync2024!', gen_salt('bf', 10)),
    NOW(), '{"provider":"email","providers":["email"]}', '{}',
    FALSE, FALSE, NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ana@tripsync.app',
    crypt('Tripsync2024!', gen_salt('bf', 10)),
    NOW(), '{"provider":"email","providers":["email"]}', '{}',
    FALSE, FALSE, NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'carlos@tripsync.app',
    crypt('Tripsync2024!', gen_salt('bf', 10)),
    NOW(), '{"provider":"email","providers":["email"]}', '{}',
    FALSE, FALSE, NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'sofia@tripsync.app',
    crypt('Tripsync2024!', gen_salt('bf', 10)),
    NOW(), '{"provider":"email","providers":["email"]}', '{}',
    FALSE, FALSE, NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  )
ON CONFLICT DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES
  (
    '1a111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"test@tripsync.app"}',
    'email', 'test@tripsync.app',
    NOW(), NOW(), NOW()
  ),
  (
    '2a222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"ana@tripsync.app"}',
    'email', 'ana@tripsync.app',
    NOW(), NOW(), NOW()
  ),
  (
    '3a333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"carlos@tripsync.app"}',
    'email', 'carlos@tripsync.app',
    NOW(), NOW(), NOW()
  ),
  (
    '4a444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '{"sub":"44444444-4444-4444-4444-444444444444","email":"sofia@tripsync.app"}',
    'email', 'sofia@tripsync.app',
    NOW(), NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, name, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Marc Yeste',    NULL),
  ('22222222-2222-2222-2222-222222222222', 'Ana García',    NULL),
  ('33333333-3333-3333-3333-333333333333', 'Carlos López',  NULL),
  ('44444444-4444-4444-4444-444444444444', 'Sofía Martín',  NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 2: TRIPS + COLLABORATORS + EXPERIENCES
-- ============================================================

INSERT INTO trips (id, title, start_date, end_date, created_by, join_code) VALUES
  (
    'aa000001-0000-0000-0000-000000000000',
    'Escapada a Roma',
    '2026-04-10', '2026-04-15',
    '11111111-1111-1111-1111-111111111111',
    'ROMA26'
  ),
  (
    'aa000002-0000-0000-0000-000000000000',
    'Aventura en Japón',
    '2026-06-20', '2026-06-30',
    '11111111-1111-1111-1111-111111111111',
    'JAPON6'
  )
ON CONFLICT DO NOTHING;

INSERT INTO trip_collaborators (trip_id, user_id, role) VALUES
  -- Roma: Marc (owner), Ana, Carlos
  ('aa000001-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aa000001-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aa000001-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'member'),
  -- Japón: Marc (owner), Ana, Sofía
  ('aa000002-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aa000002-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aa000002-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'member')
ON CONFLICT DO NOTHING;

-- Experiences: Roma
INSERT INTO experiences (id, trip_id, type, title, location, confirmation_code, start_time, end_time, date, created_by) VALUES
  (
    'bb000001-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'transport', 'Vuelo BCN → FCO',
    '{"name":"Aeropuerto El Prat, Barcelona","latitude":41.2974,"longitude":2.0833}',
    'IB1234', '07:30', '09:45', '2026-04-10',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000002-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'accommodation', 'Hotel Colosseo',
    '{"name":"Via Capo le Case 18, Roma","latitude":41.9028,"longitude":12.4964}',
    'HOTEL-COL-42', '14:00', NULL, '2026-04-10',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000003-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'activity', 'Visita al Coliseo',
    '{"name":"Coliseo Romano, Roma","latitude":41.8902,"longitude":12.4922}',
    'COL-2026-1', '10:00', '13:00', '2026-04-11',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'bb000004-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'restaurant', 'Trattoria da Marco',
    '{"name":"Via della Croce 38, Roma","latitude":41.9054,"longitude":12.4788}',
    NULL, '20:30', '22:30', '2026-04-12',
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'bb000005-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'activity', 'Museos Vaticanos',
    '{"name":"Viale Vaticano, Roma","latitude":41.9065,"longitude":12.4536}',
    'VAT-2026-98', '09:00', '13:00', '2026-04-13',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000006-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'transport', 'Vuelo FCO → BCN',
    '{"name":"Aeropuerto Fiumicino, Roma","latitude":41.8003,"longitude":12.2389}',
    'IB1235', '18:00', '20:15', '2026-04-15',
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT DO NOTHING;

-- Experiences: Japón
INSERT INTO experiences (id, trip_id, type, title, location, confirmation_code, start_time, end_time, date, created_by) VALUES
  (
    'bb000011-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'transport', 'Vuelo MAD → NRT',
    '{"name":"Aeropuerto Adolfo Suárez, Madrid","latitude":40.4936,"longitude":-3.5668}',
    'JL8048', '11:00', '07:30', '2026-06-20',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000012-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'accommodation', 'Park Hyatt Tokyo',
    '{"name":"Nishi-Shinjuku 3-7-1, Tokyo","latitude":35.6895,"longitude":139.6917}',
    'PH-TYO-2026', '15:00', NULL, '2026-06-21',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000013-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'activity', 'Templo Senso-ji',
    '{"name":"Senso-ji, Asakusa, Tokyo","latitude":35.7148,"longitude":139.7967}',
    NULL, '09:00', '11:30', '2026-06-22',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'bb000014-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'restaurant', 'Sushi Saito',
    '{"name":"Minato, Tokyo","latitude":35.6628,"longitude":139.7387}',
    NULL, '19:00', '21:00', '2026-06-23',
    '44444444-4444-4444-4444-444444444444'
  ),
  (
    'bb000015-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'accommodation', 'Ryokan Hakone Ginyu',
    '{"name":"Sengokuhara, Hakone","latitude":35.2329,"longitude":139.0478}',
    'RYK-HAK-88', '16:00', NULL, '2026-06-25',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000016-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'activity', 'Escalada Monte Fuji',
    '{"name":"Monte Fuji, Shizuoka","latitude":35.3606,"longitude":138.7274}',
    NULL, '05:00', '14:00', '2026-06-26',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bb000017-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'transport', 'Vuelo NRT → MAD',
    '{"name":"Aeropuerto Narita, Tokyo","latitude":35.7653,"longitude":140.3856}',
    'JL8049', '10:30', '15:45', '2026-06-30',
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 3: RATINGS + EXPENSES + SPLITS + MEMORIES
-- ============================================================

-- Ratings on Roma experiences
INSERT INTO experience_ratings (experience_id, user_id, rating) VALUES
  -- Coliseo
  ('bb000003-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 5),
  ('bb000003-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 4),
  ('bb000003-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 5),
  -- Trattoria
  ('bb000004-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 4),
  ('bb000004-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 5),
  ('bb000004-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 4),
  -- Vaticano
  ('bb000005-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 5),
  ('bb000005-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 5)
ON CONFLICT DO NOTHING;

-- Expenses: Roma
-- Marc pagó vuelos (399€, split 133 each, Carlos ya liquidó con Marc)
INSERT INTO expenses (id, trip_id, experience_id, amount, currency, description, payer_id) VALUES
  (
    'cc000001-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'bb000001-0000-0000-0000-000000000000',
    399.00, 'EUR', 'Vuelos BCN ↔ FCO (ida)',
    '11111111-1111-1111-1111-111111111111'
  ),
  -- Ana pagó hotel (285€, split 95 each)
  (
    'cc000002-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'bb000002-0000-0000-0000-000000000000',
    285.00, 'EUR', 'Hotel Colosseo (5 noches)',
    '22222222-2222-2222-2222-222222222222'
  ),
  -- Carlos pagó entradas Coliseo (54€, split 18 each)
  (
    'cc000003-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'bb000003-0000-0000-0000-000000000000',
    54.00, 'EUR', 'Entradas Coliseo + arena',
    '33333333-3333-3333-3333-333333333333'
  ),
  -- Marc pagó cena trattoria (87€, split 29 each)
  (
    'cc000004-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    'bb000004-0000-0000-0000-000000000000',
    87.00, 'EUR', 'Cena Trattoria da Marco',
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT DO NOTHING;

-- Expense splits: Roma
-- Vuelos (Marc pagó): Marc settled, Ana NOT, Carlos settled (ya liquidó)
INSERT INTO expense_splits (expense_id, user_id, amount, is_settled) VALUES
  ('cc000001-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 133.00, TRUE),
  ('cc000001-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 133.00, FALSE),
  ('cc000001-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 133.00, TRUE),
  -- Hotel (Ana pagó): Marc NOT, Ana settled, Carlos NOT
  ('cc000002-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 95.00, FALSE),
  ('cc000002-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 95.00, TRUE),
  ('cc000002-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 95.00, FALSE),
  -- Coliseo (Carlos pagó): Marc NOT, Ana settled, Carlos settled
  ('cc000003-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 18.00, FALSE),
  ('cc000003-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 18.00, TRUE),
  ('cc000003-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 18.00, TRUE),
  -- Cena (Marc pagó): Marc settled, Ana NOT, Carlos NOT
  ('cc000004-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 29.00, TRUE),
  ('cc000004-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 29.00, FALSE),
  ('cc000004-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 29.00, FALSE)
ON CONFLICT DO NOTHING;

-- Expenses: Japón (upcoming, todo pendiente)
INSERT INTO expenses (id, trip_id, experience_id, amount, currency, description, payer_id) VALUES
  (
    'cc000011-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'bb000011-0000-0000-0000-000000000000',
    1740.00, 'EUR', 'Vuelos MAD ↔ NRT (x3)',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'cc000012-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    'bb000012-0000-0000-0000-000000000000',
    450.00, 'EUR', 'Park Hyatt Tokyo (4 noches)',
    '44444444-4444-4444-4444-444444444444'
  )
ON CONFLICT DO NOTHING;

-- Expense splits: Japón (todo unsettled)
INSERT INTO expense_splits (expense_id, user_id, amount, is_settled) VALUES
  ('cc000011-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 580.00, TRUE),
  ('cc000011-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 580.00, FALSE),
  ('cc000011-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 580.00, FALSE),
  ('cc000012-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 150.00, FALSE),
  ('cc000012-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 150.00, FALSE),
  ('cc000012-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 150.00, TRUE)
ON CONFLICT DO NOTHING;

-- Memories: Roma
INSERT INTO memories (id, trip_id, user_id, image_url, caption, created_at) VALUES
  (
    'dd000001-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'https://picsum.photos/seed/colosseum/800/600',
    'Primera vista del Coliseo, increíble',
    '2026-04-11 11:30:00+00'
  ),
  (
    'dd000002-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'https://picsum.photos/seed/italyfood/800/600',
    'La mejor pasta de mi vida',
    '2026-04-12 21:15:00+00'
  ),
  (
    'dd000003-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'https://picsum.photos/seed/vatican/800/600',
    'Capilla Sixtina, sin palabras',
    '2026-04-13 12:00:00+00'
  ),
  (
    'dd000004-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'https://picsum.photos/seed/rome_sunset/800/600',
    'Puesta de sol desde el Pincio',
    '2026-04-13 19:45:00+00'
  ),
  (
    'dd000005-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'https://picsum.photos/seed/fontana/800/600',
    'La Fontana di Trevi, moneda tirada',
    '2026-04-14 10:30:00+00'
  ),
  (
    'dd000006-0000-0000-0000-000000000000',
    'aa000001-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'https://picsum.photos/seed/rome_group/800/600',
    'Foto de grupo en el Foro Romano',
    '2026-04-14 16:20:00+00'
  )
ON CONFLICT DO NOTHING;

-- Memories: Japón (solo algunas, el viaje no ha pasado aún)
INSERT INTO memories (id, trip_id, user_id, image_url, caption, created_at) VALUES
  (
    'dd000011-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'https://picsum.photos/seed/tokyo_skyline/800/600',
    'Tokyo desde el avión',
    '2026-06-20 14:00:00+00'
  ),
  (
    'dd000012-0000-0000-0000-000000000000',
    'aa000002-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'https://picsum.photos/seed/sensoji_temple/800/600',
    'Senso-ji al amanecer, magia pura',
    '2026-06-22 09:45:00+00'
  )
ON CONFLICT DO NOTHING;
