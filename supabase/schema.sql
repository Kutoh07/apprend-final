--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: calculate_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_user_streak(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$

DECLARE

    current_streak integer := 0;

    check_date date;

    activity_found boolean;

BEGIN

    check_date := CURRENT_DATE;

    

    -- V├⌐rifier chaque jour en remontant

    LOOP

        SELECT EXISTS(

            SELECT 1 

            FROM user_renaissance_progress 

            WHERE user_id = p_user_id 

              AND last_attempt_at::date = check_date

        ) INTO activity_found;

        

        IF NOT activity_found THEN

            EXIT;

        END IF;

        

        current_streak := current_streak + 1;

        check_date := check_date - INTERVAL '1 day';

        

        -- Limite pour ├⌐viter les boucles infinies

        IF current_streak > 365 THEN

            EXIT;

        END IF;

    END LOOP;

    

    RETURN current_streak;

END;

$$;


--
-- Name: get_user_accuracy_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_accuracy_stats(p_user_id uuid) RETURNS TABLE(axe_id uuid, stage text, accuracy numeric, last_attempt timestamp with time zone)
    LANGUAGE plpgsql
    AS $$

BEGIN

    RETURN QUERY

    SELECT 

        up.axe_id,

        up.stage,

        CASE 

            WHEN jsonb_array_length(COALESCE(up.attempts, '[]'::jsonb)) > 0 

            THEN (

                SELECT COUNT(*)::decimal / jsonb_array_length(up.attempts) * 100

                FROM jsonb_array_elements(up.attempts) as attempt

                WHERE (attempt->>'isCorrect')::boolean = true

            )

            ELSE 0::decimal

        END as accuracy,

        up.last_attempt_at

    FROM user_renaissance_progress up

    WHERE up.user_id = p_user_id;

END;

$$;


--
-- Name: get_user_complete_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_complete_stats(p_user_id uuid) RETURNS TABLE(axes_selected integer, axes_completed integer, overall_progress numeric, global_accuracy numeric, total_time_hours numeric, current_streak integer, achievements_unlocked integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

    RETURN QUERY

    WITH fresh_stats AS (

        SELECT 

            COUNT(DISTINCT sel.axe_id) as selected_count,

            COUNT(DISTINCT CASE WHEN prog.stage = 'level3' AND prog.stage_completed THEN prog.axe_id END) as completed_count,

            AVG(prog.accuracy) as avg_accuracy,

            SUM(prog.total_time_spent_ms) / 1000.0 / 3600.0 as time_hours

        FROM user_renaissance_selection sel

        LEFT JOIN user_renaissance_progress prog ON sel.user_id = prog.user_id AND sel.axe_id = prog.axe_id

        WHERE sel.user_id = p_user_id

    )

    SELECT 

        fs.selected_count::INTEGER,

        fs.completed_count::INTEGER,

        CASE 

            WHEN fs.selected_count > 0 THEN (fs.completed_count::DECIMAL / fs.selected_count * 100)

            ELSE 0

        END,

        COALESCE(fs.avg_accuracy, 0)::DECIMAL,

        COALESCE(fs.time_hours, 0)::DECIMAL,

        COALESCE(cache.current_streak_days, 0)::INTEGER,

        0::INTEGER -- Achievements ├á impl├⌐menter

    FROM fresh_stats fs

    LEFT JOIN renaissance_user_stats_cache cache ON cache.user_id = p_user_id;

END;

$$;


--
-- Name: get_user_renaissance_dashboard_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_renaissance_dashboard_stats(p_user_id uuid) RETURNS TABLE(axes_selected integer, axes_completed integer, overall_progress numeric, avg_accuracy numeric, total_time_spent_hours numeric, current_streak_days integer, last_activity timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

    RETURN QUERY

    WITH user_stats AS (

        SELECT 

            COUNT(DISTINCT sel.axe_id) as selected_count,

            COUNT(DISTINCT CASE 

                WHEN prog.stage = 'level3' AND prog.stage_completed 

                THEN prog.axe_id 

            END) as completed_count,

            MAX(prog.last_attempt_at) as last_activity,

            EXTRACT(EPOCH FROM (MAX(prog.last_attempt_at) - MIN(sel.selected_at))) / 3600 as time_hours

        FROM user_renaissance_selection sel

        LEFT JOIN user_renaissance_progress prog ON sel.user_id = prog.user_id AND sel.axe_id = prog.axe_id

        WHERE sel.user_id = p_user_id

    ),

    accuracy_stats AS (

        SELECT 

            AVG(

                CASE 

                    WHEN prog.attempts IS NOT NULL AND jsonb_array_length(prog.attempts) > 0

                    THEN (

                        SELECT COUNT(*)::decimal / jsonb_array_length(prog.attempts) * 100

                        FROM jsonb_array_elements(prog.attempts) as attempt

                        WHERE (attempt->>'isCorrect')::boolean = true

                    )

                    ELSE NULL

                END

            ) as calculated_avg_accuracy

        FROM user_renaissance_progress prog

        WHERE prog.user_id = p_user_id

          AND prog.attempts IS NOT NULL

    )

    SELECT 

        us.selected_count::integer,

        us.completed_count::integer,

        CASE 

            WHEN us.selected_count > 0 

            THEN (us.completed_count::decimal / us.selected_count * 100)

            ELSE 0 

        END::decimal,

        COALESCE(ac.calculated_avg_accuracy, 0)::decimal,

        COALESCE(us.time_hours, 0)::decimal,

        CASE 

            WHEN us.last_activity::date = CURRENT_DATE THEN 1

            ELSE 0 

        END::integer,

        us.last_activity

    FROM user_stats us

    CROSS JOIN accuracy_stats ac;

END;

$$;


--
-- Name: migrate_existing_renaissance_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_existing_renaissance_data() RETURNS text
    LANGUAGE plpgsql
    AS $$

DECLARE

    migration_count INTEGER := 0;

BEGIN

    -- Migrer les anciennes donn├⌐es si elles existent

    -- Cette fonction sera adapt├⌐e selon vos donn├⌐es actuelles

    

    -- Initialiser le cache pour tous les utilisateurs

    INSERT INTO renaissance_user_stats_cache (user_id)

    SELECT DISTINCT user_id FROM user_renaissance_selection

    ON CONFLICT (user_id) DO NOTHING;

    

    GET DIAGNOSTICS migration_count = ROW_COUNT;

    

    RETURN format('Migration completed. %s user stat caches initialized.', migration_count);

END;

$$;


--
-- Name: update_renaissance_stats_realtime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_renaissance_stats_realtime() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Mettre ├á jour le cache des stats quand une tentative est cr├⌐├⌐e

    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'renaissance_attempts' THEN

        INSERT INTO renaissance_user_stats_cache (user_id)

        SELECT DISTINCT s.user_id 

        FROM renaissance_game_sessions s 

        WHERE s.id = NEW.session_id

        ON CONFLICT (user_id) DO UPDATE SET

            total_attempts = renaissance_user_stats_cache.total_attempts + 1,

            last_calculated_at = NOW();

    END IF;

    

    -- Mettre ├á jour quand une session se termine

    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'renaissance_game_sessions' 

       AND NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN

        

        UPDATE renaissance_user_stats_cache 

        SET 

            total_sessions = total_sessions + 1,

            total_time_spent_minutes = total_time_spent_minutes + 

                EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60,

            last_calculated_at = NOW()

        WHERE user_id = NEW.user_id;

    END IF;

    

    RETURN COALESCE(NEW, OLD);

END;

$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;

$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: renaissance_axes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renaissance_axes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    description text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_customizable boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: renaissance_game_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renaissance_game_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    axe_id uuid NOT NULL,
    stage text NOT NULL,
    flash_duration_ms integer NOT NULL,
    phrases_order integer[] NOT NULL,
    current_phrase_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_completed boolean DEFAULT false,
    correct_count integer DEFAULT 0,
    total_attempts integer DEFAULT 0,
    session_accuracy numeric(5,2) DEFAULT 0,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now(),
    device_info jsonb,
    browser_info jsonb,
    CONSTRAINT valid_flash_duration CHECK ((flash_duration_ms = ANY (ARRAY[500, 1500, 3000]))),
    CONSTRAINT valid_stage CHECK ((stage = ANY (ARRAY['discovery'::text, 'level1'::text, 'level2'::text, 'level3'::text])))
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    birth_year integer NOT NULL,
    profession text NOT NULL,
    gender text,
    phone text,
    country text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completion_percentage integer DEFAULT 0,
    profile_completeness jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT check_birth_year CHECK (((birth_year >= 1920) AND ((birth_year)::numeric <= EXTRACT(year FROM now())))),
    CONSTRAINT user_profiles_completion_percentage_check CHECK (((completion_percentage >= 0) AND (completion_percentage <= 100)))
);


--
-- Name: active_renaissance_sessions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_renaissance_sessions AS
 SELECT s.id,
    s.user_id,
    up.name AS user_name,
    ax.name AS axe_name,
    s.stage,
    s.current_phrase_index,
    array_length(s.phrases_order, 1) AS total_phrases,
    s.session_accuracy,
    s.started_at,
    s.last_activity_at,
    (now() - s.last_activity_at) AS idle_duration
   FROM ((public.renaissance_game_sessions s
     JOIN public.user_profiles up ON ((s.user_id = up.user_id)))
     JOIN public.renaissance_axes ax ON ((s.axe_id = ax.id)))
  WHERE (s.is_active = true)
  ORDER BY s.last_activity_at DESC;


--
-- Name: programme_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programme_entries (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    subpart_id integer NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    validation_status text DEFAULT 'pending'::text,
    validation_notes text,
    word_count integer GENERATED ALWAYS AS (array_length(string_to_array(TRIM(BOTH FROM value), ' '::text), 1)) STORED,
    CONSTRAINT programme_entries_validation_status_check CHECK ((validation_status = ANY (ARRAY['pending'::text, 'valid'::text, 'invalid'::text])))
);


--
-- Name: renaissance_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renaissance_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    phrase_id uuid NOT NULL,
    phrase_number integer NOT NULL,
    user_input text NOT NULL,
    expected_text text NOT NULL,
    is_correct boolean NOT NULL,
    response_time_ms integer,
    input_length integer GENERATED ALWAYS AS (length(user_input)) STORED,
    similarity_score numeric(5,2),
    error_analysis jsonb,
    error_type text,
    shown_at timestamp with time zone NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT renaissance_attempts_response_time_ms_check CHECK ((response_time_ms > 0)),
    CONSTRAINT renaissance_attempts_similarity_score_check CHECK (((similarity_score >= (0)::numeric) AND (similarity_score <= (100)::numeric)))
);


--
-- Name: user_renaissance_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_renaissance_progress (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    axe_id uuid,
    stage text NOT NULL,
    current_phrase integer DEFAULT 1 NOT NULL,
    attempts jsonb DEFAULT '{}'::jsonb NOT NULL,
    stage_completed boolean DEFAULT false NOT NULL,
    stage_completed_at timestamp with time zone,
    last_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_renaissance_progress_stage_check CHECK ((stage = ANY (ARRAY['discovery'::text, 'level1'::text, 'level2'::text, 'level3'::text])))
);


--
-- Name: user_renaissance_selection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_renaissance_selection (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    axe_id uuid,
    custom_name text,
    custom_phrases jsonb,
    selection_order integer NOT NULL,
    is_started boolean DEFAULT false NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    selected_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone
);


--
-- Name: renaissance_dashboard_data; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.renaissance_dashboard_data AS
 SELECT u.id AS user_id,
    u.email,
    COALESCE(up.name, split_part((u.email)::text, '@'::text, 1)) AS name,
    count(DISTINCT sel.axe_id) AS axes_selected,
    count(DISTINCT
        CASE
            WHEN ((prog.stage = 'level3'::text) AND prog.stage_completed) THEN prog.axe_id
            ELSE NULL::uuid
        END) AS axes_completed,
    COALESCE(avg(
        CASE
            WHEN ((prog.attempts IS NOT NULL) AND (jsonb_array_length(prog.attempts) > 0)) THEN ( SELECT (((count(*))::numeric / (jsonb_array_length(prog.attempts))::numeric) * (100)::numeric)
               FROM jsonb_array_elements(prog.attempts) attempt(value)
              WHERE (((attempt.value ->> 'isCorrect'::text))::boolean = true))
            ELSE NULL::numeric
        END), (0)::numeric) AS average_accuracy,
        CASE
            WHEN (count(DISTINCT sel.axe_id) > 0) THEN (((count(DISTINCT
            CASE
                WHEN ((prog.stage = 'level3'::text) AND prog.stage_completed) THEN prog.axe_id
                ELSE NULL::uuid
            END))::numeric / (count(DISTINCT sel.axe_id))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS overall_progress_percentage,
    (EXTRACT(epoch FROM (max(prog.last_attempt_at) - min(sel.selected_at))) / (3600)::numeric) AS total_time_hours,
    max(prog.last_attempt_at) AS last_activity_date,
    count(DISTINCT prog.id) AS total_sessions,
    sum(
        CASE
            WHEN prog.stage_completed THEN 1
            ELSE 0
        END) AS stages_completed,
        CASE
            WHEN ((max(prog.last_attempt_at))::date = CURRENT_DATE) THEN 1
            ELSE 0
        END AS current_streak_days
   FROM (((auth.users u
     LEFT JOIN public.user_profiles up ON ((u.id = up.user_id)))
     LEFT JOIN public.user_renaissance_selection sel ON ((u.id = sel.user_id)))
     LEFT JOIN public.user_renaissance_progress prog ON (((sel.user_id = prog.user_id) AND (sel.axe_id = prog.axe_id))))
  GROUP BY u.id, u.email, up.name;


--
-- Name: renaissance_dashboard_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.renaissance_dashboard_summary AS
 SELECT u.id AS user_id,
    u.email,
    up.name,
    count(DISTINCT sel.axe_id) AS axes_selected,
    count(DISTINCT
        CASE
            WHEN prog.stage_completed THEN prog.axe_id
            ELSE NULL::uuid
        END) AS axes_with_progress,
    count(DISTINCT prog.id) AS total_progress_entries,
    min(sel.selected_at) AS first_selection_date,
    max(prog.last_attempt_at) AS last_activity_date,
        CASE
            WHEN (count(DISTINCT sel.axe_id) > 0) THEN (count(DISTINCT
            CASE
                WHEN prog.stage_completed THEN prog.axe_id
                ELSE NULL::uuid
            END) >= count(DISTINCT sel.axe_id))
            ELSE false
        END AS has_completed_all_axes
   FROM (((auth.users u
     LEFT JOIN public.user_profiles up ON ((u.id = up.user_id)))
     LEFT JOIN public.user_renaissance_selection sel ON ((u.id = sel.user_id)))
     LEFT JOIN public.user_renaissance_progress prog ON (((sel.user_id = prog.user_id) AND (sel.axe_id = prog.axe_id))))
  GROUP BY u.id, u.email, up.name;


--
-- Name: renaissance_phrases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renaissance_phrases (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    axe_id uuid,
    phrase_number integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: renaissance_user_stats_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renaissance_user_stats_cache (
    user_id uuid NOT NULL,
    total_axes_selected integer DEFAULT 0,
    total_axes_started integer DEFAULT 0,
    total_axes_completed integer DEFAULT 0,
    overall_progress_percentage numeric(5,2) DEFAULT 0,
    global_accuracy numeric(5,2) DEFAULT 0,
    total_sessions integer DEFAULT 0,
    total_attempts integer DEFAULT 0,
    total_time_spent_minutes integer DEFAULT 0,
    current_streak_days integer DEFAULT 0,
    longest_streak_days integer DEFAULT 0,
    last_activity_date date,
    discovery_best_accuracy numeric(5,2) DEFAULT 0,
    level1_best_accuracy numeric(5,2) DEFAULT 0,
    level2_best_accuracy numeric(5,2) DEFAULT 0,
    level3_best_accuracy numeric(5,2) DEFAULT 0,
    last_calculated_at timestamp with time zone DEFAULT now(),
    calculation_version integer DEFAULT 1,
    CONSTRAINT renaissance_user_stats_cache_check CHECK ((total_axes_completed <= total_axes_started)),
    CONSTRAINT renaissance_user_stats_cache_check1 CHECK ((total_axes_started <= total_axes_selected))
);


--
-- Name: subpart_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subpart_progress (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    subpart_id integer NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_axe_detailed_progress; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_axe_detailed_progress AS
 SELECT prog.user_id,
    prog.axe_id,
    ax.name AS axe_name,
    ax.icon AS axe_icon,
    sel.custom_name,
    count(*) AS total_stages_attempted,
    sum(
        CASE
            WHEN prog.stage_completed THEN 1
            ELSE 0
        END) AS stages_completed,
    max(
        CASE
            WHEN ((prog.stage = 'discovery'::text) AND prog.stage_completed) THEN 1
            ELSE 0
        END) AS discovery_completed,
    max(
        CASE
            WHEN ((prog.stage = 'level1'::text) AND prog.stage_completed) THEN 1
            ELSE 0
        END) AS level1_completed,
    max(
        CASE
            WHEN ((prog.stage = 'level2'::text) AND prog.stage_completed) THEN 1
            ELSE 0
        END) AS level2_completed,
    max(
        CASE
            WHEN ((prog.stage = 'level3'::text) AND prog.stage_completed) THEN 1
            ELSE 0
        END) AS level3_completed,
    max(
        CASE
            WHEN ((prog.stage = 'discovery'::text) AND (prog.attempts IS NOT NULL)) THEN ( SELECT (((count(*))::numeric / (jsonb_array_length(prog.attempts))::numeric) * (100)::numeric)
               FROM jsonb_array_elements(prog.attempts) attempt(value)
              WHERE (((attempt.value ->> 'isCorrect'::text))::boolean = true))
            ELSE NULL::numeric
        END) AS discovery_accuracy,
    max(
        CASE
            WHEN ((prog.stage = 'level1'::text) AND (prog.attempts IS NOT NULL)) THEN ( SELECT (((count(*))::numeric / (jsonb_array_length(prog.attempts))::numeric) * (100)::numeric)
               FROM jsonb_array_elements(prog.attempts) attempt(value)
              WHERE (((attempt.value ->> 'isCorrect'::text))::boolean = true))
            ELSE NULL::numeric
        END) AS level1_accuracy,
    min(prog.last_attempt_at) AS first_attempt_at,
    max(prog.last_attempt_at) AS last_attempt_at,
    (((sum(
        CASE
            WHEN prog.stage_completed THEN 1
            ELSE 0
        END))::numeric / (4)::numeric) * (100)::numeric) AS axe_completion_percentage
   FROM ((public.user_renaissance_progress prog
     JOIN public.renaissance_axes ax ON ((prog.axe_id = ax.id)))
     JOIN public.user_renaissance_selection sel ON (((prog.user_id = sel.user_id) AND (prog.axe_id = sel.axe_id))))
  GROUP BY prog.user_id, prog.axe_id, ax.name, ax.icon, sel.custom_name;


--
-- Name: user_programmes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_programmes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    current_subpart integer DEFAULT 0 NOT NULL,
    overall_progress integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: programme_entries programme_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programme_entries
    ADD CONSTRAINT programme_entries_pkey PRIMARY KEY (id);


--
-- Name: renaissance_attempts renaissance_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_attempts
    ADD CONSTRAINT renaissance_attempts_pkey PRIMARY KEY (id);


--
-- Name: renaissance_axes renaissance_axes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_axes
    ADD CONSTRAINT renaissance_axes_pkey PRIMARY KEY (id);


--
-- Name: renaissance_game_sessions renaissance_game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_game_sessions
    ADD CONSTRAINT renaissance_game_sessions_pkey PRIMARY KEY (id);


--
-- Name: renaissance_phrases renaissance_phrases_axe_id_phrase_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_phrases
    ADD CONSTRAINT renaissance_phrases_axe_id_phrase_number_key UNIQUE (axe_id, phrase_number);


--
-- Name: renaissance_phrases renaissance_phrases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_phrases
    ADD CONSTRAINT renaissance_phrases_pkey PRIMARY KEY (id);


--
-- Name: renaissance_user_stats_cache renaissance_user_stats_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_user_stats_cache
    ADD CONSTRAINT renaissance_user_stats_cache_pkey PRIMARY KEY (user_id);


--
-- Name: subpart_progress subpart_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subpart_progress
    ADD CONSTRAINT subpart_progress_pkey PRIMARY KEY (id);


--
-- Name: subpart_progress subpart_progress_user_id_subpart_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subpart_progress
    ADD CONSTRAINT subpart_progress_user_id_subpart_id_key UNIQUE (user_id, subpart_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);


--
-- Name: user_programmes user_programmes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_programmes
    ADD CONSTRAINT user_programmes_pkey PRIMARY KEY (id);


--
-- Name: user_programmes user_programmes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_programmes
    ADD CONSTRAINT user_programmes_user_id_key UNIQUE (user_id);


--
-- Name: user_renaissance_progress user_renaissance_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_progress
    ADD CONSTRAINT user_renaissance_progress_pkey PRIMARY KEY (id);


--
-- Name: user_renaissance_progress user_renaissance_progress_user_id_axe_id_stage_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_progress
    ADD CONSTRAINT user_renaissance_progress_user_id_axe_id_stage_key UNIQUE (user_id, axe_id, stage);


--
-- Name: user_renaissance_selection user_renaissance_selection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_selection
    ADD CONSTRAINT user_renaissance_selection_pkey PRIMARY KEY (id);


--
-- Name: user_renaissance_selection user_renaissance_selection_user_id_axe_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_selection
    ADD CONSTRAINT user_renaissance_selection_user_id_axe_id_key UNIQUE (user_id, axe_id);


--
-- Name: user_renaissance_selection user_renaissance_selection_user_id_selection_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_selection
    ADD CONSTRAINT user_renaissance_selection_user_id_selection_order_key UNIQUE (user_id, selection_order);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_attempts_analysis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_analysis ON public.renaissance_attempts USING btree (session_id, is_correct, response_time_ms);


--
-- Name: idx_game_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_active ON public.renaissance_game_sessions USING btree (user_id, is_active, last_activity_at DESC);


--
-- Name: idx_programme_entries_user_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programme_entries_user_optimized ON public.programme_entries USING btree (user_id, subpart_id, created_at DESC);


--
-- Name: idx_programme_entries_user_subpart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programme_entries_user_subpart ON public.programme_entries USING btree (user_id, subpart_id);


--
-- Name: idx_programme_entries_user_subpart_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programme_entries_user_subpart_created ON public.programme_entries USING btree (user_id, subpart_id, created_at DESC);


--
-- Name: idx_progress_completion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_completion ON public.user_renaissance_progress USING btree (user_id, stage_completed, last_attempt_at DESC);


--
-- Name: idx_progress_user_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_user_lookup ON public.user_renaissance_progress USING btree (user_id, axe_id, stage);


--
-- Name: idx_renaissance_phrases_axe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renaissance_phrases_axe ON public.renaissance_phrases USING btree (axe_id, phrase_number);


--
-- Name: idx_renaissance_progress_user_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renaissance_progress_user_optimized ON public.user_renaissance_progress USING btree (user_id, axe_id, stage, stage_completed);


--
-- Name: idx_renaissance_progress_user_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renaissance_progress_user_stage ON public.user_renaissance_progress USING btree (user_id, stage, stage_completed);


--
-- Name: idx_renaissance_selection_user_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_renaissance_selection_user_optimized ON public.user_renaissance_selection USING btree (user_id, selection_order);


--
-- Name: idx_subpart_progress_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subpart_progress_user ON public.subpart_progress USING btree (user_id);


--
-- Name: idx_subpart_progress_user_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subpart_progress_user_completed ON public.subpart_progress USING btree (user_id, completed, subpart_id);


--
-- Name: idx_subpart_progress_user_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subpart_progress_user_optimized ON public.subpart_progress USING btree (user_id, completed, subpart_id);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_renaissance_progress_user_axe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_renaissance_progress_user_axe ON public.user_renaissance_progress USING btree (user_id, axe_id);


--
-- Name: idx_user_renaissance_selection_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_renaissance_selection_user ON public.user_renaissance_selection USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: renaissance_attempts tr_update_stats_on_attempt; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_update_stats_on_attempt AFTER INSERT ON public.renaissance_attempts FOR EACH ROW EXECUTE FUNCTION public.update_renaissance_stats_realtime();


--
-- Name: renaissance_game_sessions tr_update_stats_on_session_complete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_update_stats_on_session_complete AFTER UPDATE ON public.renaissance_game_sessions FOR EACH ROW EXECUTE FUNCTION public.update_renaissance_stats_realtime();


--
-- Name: programme_entries update_programme_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_programme_entries_updated_at BEFORE UPDATE ON public.programme_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: programme_entries programme_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programme_entries
    ADD CONSTRAINT programme_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: renaissance_attempts renaissance_attempts_phrase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_attempts
    ADD CONSTRAINT renaissance_attempts_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.renaissance_phrases(id) ON DELETE CASCADE;


--
-- Name: renaissance_attempts renaissance_attempts_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_attempts
    ADD CONSTRAINT renaissance_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.renaissance_game_sessions(id) ON DELETE CASCADE;


--
-- Name: renaissance_game_sessions renaissance_game_sessions_axe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_game_sessions
    ADD CONSTRAINT renaissance_game_sessions_axe_id_fkey FOREIGN KEY (axe_id) REFERENCES public.renaissance_axes(id) ON DELETE CASCADE;


--
-- Name: renaissance_game_sessions renaissance_game_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_game_sessions
    ADD CONSTRAINT renaissance_game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: renaissance_phrases renaissance_phrases_axe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_phrases
    ADD CONSTRAINT renaissance_phrases_axe_id_fkey FOREIGN KEY (axe_id) REFERENCES public.renaissance_axes(id) ON DELETE CASCADE;


--
-- Name: renaissance_user_stats_cache renaissance_user_stats_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renaissance_user_stats_cache
    ADD CONSTRAINT renaissance_user_stats_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subpart_progress subpart_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subpart_progress
    ADD CONSTRAINT subpart_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_programmes user_programmes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_programmes
    ADD CONSTRAINT user_programmes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_renaissance_progress user_renaissance_progress_axe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_progress
    ADD CONSTRAINT user_renaissance_progress_axe_id_fkey FOREIGN KEY (axe_id) REFERENCES public.renaissance_axes(id) ON DELETE CASCADE;


--
-- Name: user_renaissance_progress user_renaissance_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_progress
    ADD CONSTRAINT user_renaissance_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_renaissance_selection user_renaissance_selection_axe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_selection
    ADD CONSTRAINT user_renaissance_selection_axe_id_fkey FOREIGN KEY (axe_id) REFERENCES public.renaissance_axes(id) ON DELETE CASCADE;


--
-- Name: user_renaissance_selection user_renaissance_selection_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_renaissance_selection
    ADD CONSTRAINT user_renaissance_selection_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_renaissance_progress Allow delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated users" ON public.user_renaissance_progress FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_renaissance_selection Allow delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated users" ON public.user_renaissance_selection FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_renaissance_progress Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.user_renaissance_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_renaissance_selection Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.user_renaissance_selection FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_renaissance_progress Allow select for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated users" ON public.user_renaissance_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_renaissance_selection Allow select for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated users" ON public.user_renaissance_selection FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_renaissance_progress Allow update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated users" ON public.user_renaissance_progress FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_renaissance_selection Allow update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated users" ON public.user_renaissance_selection FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: programme_entries Enable all for authenticated users on programme_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for authenticated users on programme_entries" ON public.programme_entries USING ((auth.uid() = user_id));


--
-- Name: subpart_progress Enable all for authenticated users on subpart_progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for authenticated users on subpart_progress" ON public.subpart_progress USING ((auth.uid() = user_id));


--
-- Name: user_profiles Enable all for authenticated users on user_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for authenticated users on user_profiles" ON public.user_profiles USING ((auth.uid() = user_id));


--
-- Name: user_programmes Enable all for authenticated users on user_programmes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for authenticated users on user_programmes" ON public.user_programmes USING ((auth.uid() = user_id));


--
-- Name: renaissance_attempts Users access own attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users access own attempts" ON public.renaissance_attempts USING ((EXISTS ( SELECT 1
   FROM public.renaissance_game_sessions s
  WHERE ((s.id = renaissance_attempts.session_id) AND (s.user_id = auth.uid())))));


--
-- Name: user_profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: renaissance_game_sessions Users manage own game sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own game sessions" ON public.renaissance_game_sessions USING ((auth.uid() = user_id));


--
-- Name: renaissance_user_stats_cache Users view own stats cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own stats cache" ON public.renaissance_user_stats_cache FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: programme_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programme_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: renaissance_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renaissance_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: renaissance_axes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renaissance_axes ENABLE ROW LEVEL SECURITY;

--
-- Name: renaissance_axes renaissance_axes_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY renaissance_axes_public_read ON public.renaissance_axes FOR SELECT USING (true);


--
-- Name: renaissance_game_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renaissance_game_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: renaissance_phrases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renaissance_phrases ENABLE ROW LEVEL SECURITY;

--
-- Name: renaissance_phrases renaissance_phrases_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY renaissance_phrases_public_read ON public.renaissance_phrases FOR SELECT USING (true);


--
-- Name: renaissance_user_stats_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renaissance_user_stats_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: subpart_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subpart_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_programmes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_programmes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_renaissance_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_renaissance_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: user_renaissance_selection; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_renaissance_selection ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


-- Table pour suivre la validation progressive de l'écran de rétention
-- Cette table permet de sauvegarder l'état d'avancement de l'utilisateur dans le stepper

CREATE TABLE retention_validation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progression dans le stepper
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  completed_steps INTEGER[] DEFAULT '{}',
  
  -- Timestamps pour chaque étape
  step_1_completed_at TIMESTAMP WITH TIME ZONE, -- Félicitations
  step_2_completed_at TIMESTAMP WITH TIME ZONE, -- C'est quoi la suite
  step_3_completed_at TIMESTAMP WITH TIME ZONE, -- Objectif module renaissance
  step_4_completed_at TIMESTAMP WITH TIME ZONE, -- Pourquoi crucial
  step_5_completed_at TIMESTAMP WITH TIME ZONE, -- Résultats recherchés
  step_6_completed_at TIMESTAMP WITH TIME ZONE, -- Comment se déroule le module
  
  -- Statut global
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id)
);

-- RLS (Row Level Security)
ALTER TABLE retention_validation ENABLE ROW LEVEL SECURITY;

-- Policy pour que les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can view own retention validation" ON retention_validation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retention validation" ON retention_validation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retention validation" ON retention_validation
  FOR UPDATE USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX idx_retention_validation_user_id ON retention_validation(user_id);
CREATE INDEX idx_retention_validation_current_step ON retention_validation(current_step);
CREATE INDEX idx_retention_validation_completed ON retention_validation(is_completed);

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_retention_validation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Si l'étape courante change, marquer l'étape précédente comme complétée
  IF NEW.current_step != OLD.current_step THEN
    NEW.completed_steps = array_append(NEW.completed_steps, OLD.current_step);
    
    -- Mettre à jour le timestamp spécifique de l'étape
    CASE OLD.current_step
      WHEN 1 THEN NEW.step_1_completed_at = NOW();
      WHEN 2 THEN NEW.step_2_completed_at = NOW();
      WHEN 3 THEN NEW.step_3_completed_at = NOW();
      WHEN 4 THEN NEW.step_4_completed_at = NOW();
      WHEN 5 THEN NEW.step_5_completed_at = NOW();
      WHEN 6 THEN NEW.step_6_completed_at = NOW();
    END CASE;
  END IF;
  
  -- Si toutes les étapes sont complétées
  IF NEW.current_step > 6 OR (NEW.step_6_completed_at IS NOT NULL AND NEW.is_completed = FALSE) THEN
    NEW.is_completed = TRUE;
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_retention_validation_updated_at
  BEFORE UPDATE ON retention_validation
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_validation_updated_at();

-- Fonction helper pour initialiser ou récupérer l'état de validation
CREATE OR REPLACE FUNCTION get_or_create_retention_validation(p_user_id UUID)
RETURNS retention_validation AS $$
DECLARE
  validation_record retention_validation;
BEGIN
  -- Essayer de récupérer l'enregistrement existant
  SELECT * INTO validation_record 
  FROM retention_validation 
  WHERE user_id = p_user_id;
  
  -- Si pas trouvé, créer un nouvel enregistrement
  IF NOT FOUND THEN
    INSERT INTO retention_validation (user_id, current_step)
    VALUES (p_user_id, 1)
    RETURNING * INTO validation_record;
  END IF;
  
  RETURN validation_record;
END;
$$ LANGUAGE plpgsql;

-- Tables pour le système d'évolution et de gamification

-- Table pour stocker les achievements/récompenses des utilisateurs
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('streak', 'completion', 'milestone', 'time_based', 'special')),
  rarity INTEGER NOT NULL CHECK (rarity >= 1 AND rarity <= 5),
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  icon VARCHAR(100),
  color VARCHAR(50),
  requirement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Table pour stocker les données de séries temporelles d'activité
CREATE TABLE user_activity_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_count INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('programme', 'renaissance', 'global')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date, activity_type)
);

-- Table pour stocker les statistiques de motivation calculées
CREATE TABLE user_motivation_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Séries et objectifs
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  weekly_goal_progress INTEGER DEFAULT 0 CHECK (weekly_goal_progress >= 0 AND weekly_goal_progress <= 100),
  
  -- Améliorations
  accuracy_improvement DECIMAL(5,2) DEFAULT 0,
  speed_improvement DECIMAL(5,2) DEFAULT 0,
  consistency_score DECIMAL(5,2) DEFAULT 0,
  
  -- Temps total investi (en minutes)
  total_time_invested INTEGER DEFAULT 0,
  
  -- Statistiques par période
  this_week_activities INTEGER DEFAULT 0,
  this_month_activities INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  
  -- Timestamps
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Table pour stocker les données de heatmap d'activité
CREATE TABLE user_activity_heatmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_count INTEGER DEFAULT 0,
  activity_level INTEGER DEFAULT 0 CHECK (activity_level >= 0 AND activity_level <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- RLS (Row Level Security) pour toutes les tables
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_motivation_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_heatmap ENABLE ROW LEVEL SECURITY;

-- Policies pour user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour user_activity_timeline
CREATE POLICY "Users can view own activity timeline" ON user_activity_timeline
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity timeline" ON user_activity_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity timeline" ON user_activity_timeline
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour user_motivation_stats
CREATE POLICY "Users can view own motivation stats" ON user_motivation_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own motivation stats" ON user_motivation_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own motivation stats" ON user_motivation_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour user_activity_heatmap
CREATE POLICY "Users can view own activity heatmap" ON user_activity_heatmap
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity heatmap" ON user_activity_heatmap
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity heatmap" ON user_activity_heatmap
  FOR UPDATE USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, unlocked);
CREATE INDEX idx_user_activity_timeline_user_date ON user_activity_timeline(user_id, date DESC);
CREATE INDEX idx_user_motivation_stats_user_id ON user_motivation_stats(user_id);
CREATE INDEX idx_user_activity_heatmap_user_date ON user_activity_heatmap(user_id, date DESC);

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_motivation_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_motivation_stats_updated_at
  BEFORE UPDATE ON user_motivation_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_motivation_stats_updated_at();

-- Fonction pour initialiser les achievements par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION initialize_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Achievements de série (streak)
  INSERT INTO user_achievements (user_id, achievement_id, title, description, type, rarity, icon, color, requirement) VALUES
  (p_user_id, 'streak_3_days', 'Première série', 'Connectez-vous 3 jours consécutifs', 'streak', 1, 'flame', 'orange', '3 jours consécutifs'),
  (p_user_id, 'streak_7_days', 'Une semaine forte', 'Connectez-vous 7 jours consécutifs', 'streak', 2, 'flame', 'orange', '7 jours consécutifs'),
  (p_user_id, 'streak_30_days', 'Mois de détermination', 'Connectez-vous 30 jours consécutifs', 'streak', 4, 'flame', 'orange', '30 jours consécutifs'),
  
  -- Achievements de completion
  (p_user_id, 'first_module', 'Premier pas', 'Complétez votre premier module', 'completion', 1, 'trophy', 'gold', '1 module complété'),
  (p_user_id, 'half_programme', 'À mi-chemin', 'Complétez 50% du programme', 'completion', 3, 'trophy', 'gold', '50% du programme'),
  (p_user_id, 'programme_complete', 'Maître du programme', 'Complétez 100% du programme', 'completion', 5, 'trophy', 'gold', '100% du programme'),
  
  -- Achievements de milestone
  (p_user_id, 'first_renaissance', 'Renaissance découverte', 'Complétez votre première session Renaissance', 'milestone', 2, 'star', 'purple', '1 session Renaissance'),
  (p_user_id, 'time_master', 'Maître du temps', 'Investissez 10 heures dans votre développement', 'time_based', 3, 'clock', 'blue', '10 heures investies'),
  
  -- Achievement spécial
  (p_user_id, 'perfectionist', 'Perfectionniste', 'Atteignez 95% de précision moyenne', 'special', 4, 'award', 'green', '95% de précision');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques d'activité
CREATE OR REPLACE FUNCTION update_user_activity_stats(p_user_id UUID, p_activity_type VARCHAR(50))
RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  activity_count INTEGER;
BEGIN
  -- Mettre à jour ou insérer dans user_activity_timeline
  INSERT INTO user_activity_timeline (user_id, date, activity_count, activity_type)
  VALUES (p_user_id, today_date, 1, p_activity_type)
  ON CONFLICT (user_id, date, activity_type)
  DO UPDATE SET 
    activity_count = user_activity_timeline.activity_count + 1;
  
  -- Calculer le niveau d'activité pour la heatmap (0-4)
  SELECT activity_count INTO activity_count
  FROM user_activity_timeline 
  WHERE user_id = p_user_id AND date = today_date AND activity_type = p_activity_type;
  
  -- Mettre à jour la heatmap
  INSERT INTO user_activity_heatmap (user_id, date, activity_count, activity_level)
  VALUES (p_user_id, today_date, activity_count, LEAST(activity_count, 4))
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    activity_count = EXCLUDED.activity_count,
    activity_level = LEAST(EXCLUDED.activity_count, 4);
    
  -- Mettre à jour les statistiques de motivation
  INSERT INTO user_motivation_stats (user_id, total_activities, last_activity_date)
  VALUES (p_user_id, 1, today_date)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_activities = user_motivation_stats.total_activities + 1,
    last_activity_date = today_date,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

--
-- PostgreSQL database dump complete
--

-- Dumped from database version 15.4 (Debian 15.4-1.pgdg120+1)
-- Dumped by pg_dump version 15.4 (Debian 15.4-1.pgdg120+1)