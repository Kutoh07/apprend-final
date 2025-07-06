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
