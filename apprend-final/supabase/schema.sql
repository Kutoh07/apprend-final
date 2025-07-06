CREATE TABLE user_programmes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  current_subpart integer NOT NULL DEFAULT 0,
  overall_progress integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE TABLE programme_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subpart_id integer NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

create table public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  name text not null,
  birth_year integer not null,
  profession text not null,
  gender text null,
  phone text null,
  country text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE TABLE subpart_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subpart_id integer NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, subpart_id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_programme_entries_user_subpart ON programme_entries(user_id, subpart_id);
CREATE INDEX idx_subpart_progress_user ON subpart_progress(user_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE user_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subpart_progress ENABLE ROW LEVEL SECURITY;

-- Politiques : les utilisateurs ne peuvent accéder qu'à leurs propres données
CREATE POLICY "Users can view own programme" ON user_programmes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own entries" ON programme_entries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON subpart_progress
    FOR ALL USING (auth.uid() = user_id);