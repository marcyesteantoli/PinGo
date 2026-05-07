-- Función reutilizable para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Perfiles (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Viajes
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  join_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colaboradores
CREATE TABLE trip_collaborators (
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (trip_id, user_id)
);

-- Experiencias
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transport', 'accommodation', 'activity', 'restaurant', 'other')),
  title TEXT NOT NULL,
  location JSONB,
  confirmation_code TEXT,
  start_time TEXT CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time TEXT CHECK (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_experiences
  BEFORE UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Valoraciones
CREATE TABLE experience_ratings (
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (experience_id, user_id)
);

CREATE VIEW experience_ratings_avg AS
SELECT
  experience_id,
  ROUND(AVG(rating)::NUMERIC, 2) AS rating_avg,
  COUNT(*) AS rating_count
FROM experience_ratings
GROUP BY experience_id;

-- Documentos
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT NOT NULL,
  payer_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reparto de gastos
CREATE TABLE expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(10,2) NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (expense_id, user_id)
);

-- Recuerdos
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX idx_experiences_trip_id ON experiences(trip_id);
CREATE INDEX idx_experiences_date ON experiences(date);
CREATE INDEX idx_documents_trip_id ON documents(trip_id);
CREATE INDEX idx_documents_experience_id ON documents(experience_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_memories_trip_id ON memories(trip_id);
CREATE INDEX idx_trip_collaborators_user_id ON trip_collaborators(user_id);
