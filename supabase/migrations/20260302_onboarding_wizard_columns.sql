ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS grade text;
