-- Idempotent seed for equipment only
-- Upserts equipment items by name so it can be run multiple times safely

BEGIN;

-- Ensure a unique constraint on equipment.name (if not exists)
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
  NULL;
END$$;

-- Upsert items
INSERT INTO equipment (name, description, category, total_quantity, available_quantity, is_active)
VALUES
  ('Canon DSLR', 'Canon EOS M50 mirrorless camera', 'Camera', 5, 5, true),
  ('Epson Projector', 'Portable projector for presentations', 'AV', 3, 3, true),
  ('Dell Inspiron', 'Windows laptop for student use', 'Laptop', 10, 10, true),
  ('Rode Microphone', 'USB condenser microphone for recording', 'Audio', 4, 4, true),
  ('Tripod', 'Adjustable camera tripod', 'Accessory', 8, 8, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  total_quantity = EXCLUDED.total_quantity,
  available_quantity = EXCLUDED.available_quantity,
  is_active = EXCLUDED.is_active;

COMMIT;
