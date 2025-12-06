-- PostgreSQL seed data for Tool-Ledger (idempotent)
-- Adds an admin user, two students, three equipment items, and two sample borrow requests.
-- This version is safe to run multiple times: it upserts users/equipment and removes prior sample borrow requests before inserting.

-- Ensure pgcrypto and enum types exist (drizzle-kit push normally created these)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined', 'returned');
  END IF;
END$$;

BEGIN;

-- Make equipment.name unique for idempotent upserts (safe for seeds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'equipment_name_key'
  ) THEN
    ALTER TABLE equipment
    ADD CONSTRAINT equipment_name_key UNIQUE (name);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- constraint already exists
  NULL;
END$$;

-- Upsert users (by email) and equipment (by name). RETURNING id for references.
WITH admin AS (
  INSERT INTO users (email, password, name, role, student_id)
  VALUES (
    'admin@example.com',
    -- plaintext password (INSECURE). Set to 'AdminPass123' by default.
    'AdminPass123',
    'Site Admin',
    'admin',
    NULL
  )
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id
  RETURNING id
),
alice AS (
  INSERT INTO users (email, password, name, role, student_id)
  VALUES ('alice@student.edu', 'AdminPass123', 'Alice Santos', 'student', 'S-1001')
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id
  RETURNING id
),
bob AS (
  INSERT INTO users (email, password, name, role, student_id)
  VALUES ('bob@student.edu', 'AdminPass123', 'Bob Reyes', 'student', 'S-1002')
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id
  RETURNING id
),
equip_camera AS (
  INSERT INTO equipment (name, description, category, total_quantity, available_quantity, is_active)
  VALUES ('Canon DSLR', 'Canon EOS M50 mirrorless camera', 'Camera', 5, 5, true)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    total_quantity = EXCLUDED.total_quantity,
    available_quantity = EXCLUDED.available_quantity,
    is_active = EXCLUDED.is_active
  RETURNING id
),
equip_projector AS (
  INSERT INTO equipment (name, description, category, total_quantity, available_quantity, is_active)
  VALUES ('Epson Projector', 'Portable projector for presentations', 'AV', 3, 3, true)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    total_quantity = EXCLUDED.total_quantity,
    available_quantity = EXCLUDED.available_quantity,
    is_active = EXCLUDED.is_active
  RETURNING id
),
equip_laptop AS (
  INSERT INTO equipment (name, description, category, total_quantity, available_quantity, is_active)
  VALUES ('Dell Inspiron', 'Windows laptop for student use', 'Laptop', 10, 10, true)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    total_quantity = EXCLUDED.total_quantity,
    available_quantity = EXCLUDED.available_quantity,
    is_active = EXCLUDED.is_active
  RETURNING id
),
removed AS (
  -- Remove any existing sample borrow requests for these users/purposes to keep seeds idempotent
  DELETE FROM borrow_requests
  WHERE (purpose = 'Course project - short term' AND user_id = (SELECT id FROM users WHERE email = 'alice@student.edu'))
     OR (purpose = 'Class presentation' AND user_id = (SELECT id FROM users WHERE email = 'bob@student.edu'))
  RETURNING id
)

-- Insert two sample borrow requests referencing the inserted/updated users & equipment
INSERT INTO borrow_requests (
  user_id, equipment_id, quantity, purpose, borrow_date, expected_return_date, actual_return_date, status, admin_notes, approved_at, approved_by
)
VALUES (
  (SELECT id FROM alice),
  (SELECT id FROM equip_laptop),
  1,
  'Course project - short term',
  now() - interval '3 days',
  now() + interval '4 days',
  NULL,
  'pending',
  NULL,
  NULL,
  NULL
), (
  (SELECT id FROM bob),
  (SELECT id FROM equip_projector),
  1,
  'Class presentation',
  now() - interval '10 days',
  now() - interval '2 days',
  now() - interval '1 day',
  'returned',
  'Returned in good condition',
  now() - interval '9 days',
  (SELECT id FROM admin)
);

COMMIT;

-- Optional: confirm counts
-- SELECT 'users' AS table, count(*) FROM users;
-- SELECT 'equipment' AS table, count(*) FROM equipment;
-- SELECT 'borrow_requests' AS table, count(*) FROM borrow_requests;
