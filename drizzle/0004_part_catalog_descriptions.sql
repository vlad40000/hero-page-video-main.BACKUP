ALTER TABLE part_number_registry
  ADD COLUMN IF NOT EXISTS description text;
