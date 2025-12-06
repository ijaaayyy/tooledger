-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined', 'returned');
  END IF;
END
$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  student_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  total_quantity integer NOT NULL DEFAULT 1,
  available_quantity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Borrow requests table
CREATE TABLE IF NOT EXISTS borrow_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar NOT NULL,
  equipment_id varchar NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  purpose text NOT NULL,
  borrow_date timestamptz NOT NULL,
  expected_return_date timestamptz NOT NULL,
  actual_return_date timestamptz,
  status request_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by varchar,

  CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_borrow_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  CONSTRAINT fk_borrow_approver FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment (category);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_user_id ON borrow_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_equipment_id ON borrow_requests (equipment_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON borrow_requests (status);
