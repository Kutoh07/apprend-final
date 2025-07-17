-- supabase/schema.sql
-- This file contains the SQL schema for the programme_entries table.
create table public.programme_entries (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  subpart_id integer not null,
  value text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint programme_entries_pkey primary key (id),
  constraint programme_entries_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_programme_entries_user_subpart on public.programme_entries using btree (user_id, subpart_id) TABLESPACE pg_default;

create index IF not exists idx_programme_entries_user_subpart_created on public.programme_entries using btree (user_id, subpart_id, created_at desc) TABLESPACE pg_default;

create trigger update_programme_entries_updated_at BEFORE
update on programme_entries for EACH row
execute FUNCTION update_updated_at_column ();


-- Subpart Progress Table
create table public.subpart_progress (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  subpart_id integer not null,
  progress integer not null default 0,
  completed boolean not null default false,
  completed_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  constraint subpart_progress_pkey primary key (id),
  constraint subpart_progress_user_id_subpart_id_key unique (user_id, subpart_id),
  constraint subpart_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_subpart_progress_user on public.subpart_progress using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_subpart_progress_user_completed on public.subpart_progress using btree (user_id, completed, subpart_id) TABLESPACE pg_default;

-- User Profiles Table
-- This table stores user profile information, including name, birth year, and profession
-- It also includes optional fields for gender, phone, and country
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
  constraint user_profiles_user_id_unique unique (user_id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;

-- User Programmes Table
-- This table tracks the user's progress in various programmes, including current subpart and overall progress
create table public.user_programmes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  current_subpart integer not null default 0,
  overall_progress integer not null default 0,
  last_updated timestamp with time zone not null default now(),
  completed_at timestamp with time zone null,
  constraint user_programmes_pkey primary key (id),
  constraint user_programmes_user_id_key unique (user_id),
  constraint user_programmes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Index for user_programmes
create table public.renaissance_axes (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  icon text not null,
  description text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_customizable boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint renaissance_axes_pkey primary key (id)
) TABLESPACE pg_default;

-- Index for renaissance_axes
create table public.renaissance_phrases (
  id uuid not null default extensions.uuid_generate_v4 (),
  axe_id uuid null,
  phrase_number integer not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  constraint renaissance_phrases_pkey primary key (id),
  constraint renaissance_phrases_axe_id_phrase_number_key unique (axe_id, phrase_number),
  constraint renaissance_phrases_axe_id_fkey foreign KEY (axe_id) references renaissance_axes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_renaissance_phrases_axe on public.renaissance_phrases using btree (axe_id, phrase_number) TABLESPACE pg_default;

-- User Renaissance Progress Table
-- This table tracks the user's progress in the Renaissance programme, including current stage, attempts, and completion status
-- It also includes a foreign key reference to the renaissance_axes table
create table public.user_renaissance_progress (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  axe_id uuid null,
  stage text not null,
  current_phrase integer not null default 1,
  attempts jsonb not null default '{}'::jsonb,
  stage_completed boolean not null default false,
  stage_completed_at timestamp with time zone null,
  last_attempt_at timestamp with time zone not null default now(),
  constraint user_renaissance_progress_pkey primary key (id),
  constraint user_renaissance_progress_user_id_axe_id_stage_key unique (user_id, axe_id, stage),
  constraint user_renaissance_progress_axe_id_fkey foreign KEY (axe_id) references renaissance_axes (id) on delete CASCADE,
  constraint user_renaissance_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_renaissance_progress_stage_check check (
    (
      stage = any (
        array[
          'discovery'::text,
          'level1'::text,
          'level2'::text,
          'level3'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_renaissance_progress_user_axe on public.user_renaissance_progress using btree (user_id, axe_id) TABLESPACE pg_default;

-- User Renaissance Selection Table
-- This table stores the user's selections in the Renaissance programme, including custom names and phrases
create table public.user_renaissance_selection (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  axe_id uuid null,
  custom_name text null,
  custom_phrases jsonb null,
  selection_order integer not null,
  is_started boolean not null default false,
  is_completed boolean not null default false,
  selected_at timestamp with time zone not null default now(),
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  constraint user_renaissance_selection_pkey primary key (id),
  constraint user_renaissance_selection_user_id_axe_id_key unique (user_id, axe_id),
  constraint user_renaissance_selection_user_id_selection_order_key unique (user_id, selection_order),
  constraint user_renaissance_selection_axe_id_fkey foreign KEY (axe_id) references renaissance_axes (id) on delete CASCADE,
  constraint user_renaissance_selection_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_renaissance_selection_user on public.user_renaissance_selection using btree (user_id) TABLESPACE pg_default;