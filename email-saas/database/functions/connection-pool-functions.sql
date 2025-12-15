-- Connection Pool Management Functions
-- Monitor and manage database connections

-- =======================
-- Connection Pool Stats
-- =======================

-- Get current connection pool statistics
CREATE OR REPLACE FUNCTION get_connection_pool_stats()
RETURNS TABLE (
  total BIGINT,
  idle BIGINT,
  active BIGINT,
  waiting BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE state = 'idle')::BIGINT AS idle,
    COUNT(*) FILTER (WHERE state = 'active')::BIGINT AS active,
    COUNT(*) FILTER (WHERE wait_event IS NOT NULL)::BIGINT AS waiting
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND pid <> pg_backend_pid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get detailed connection information
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS TABLE (
  pid INTEGER,
  username TEXT,
  application_name TEXT,
  client_addr TEXT,
  state TEXT,
  query TEXT,
  duration_seconds INTEGER,
  wait_event TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_activity.pid::INTEGER,
    pg_stat_activity.usename::TEXT,
    pg_stat_activity.application_name::TEXT,
    pg_stat_activity.client_addr::TEXT,
    pg_stat_activity.state::TEXT,
    pg_stat_activity.query::TEXT,
    EXTRACT(SECONDS FROM (NOW() - pg_stat_activity.query_start))::INTEGER AS duration_seconds,
    pg_stat_activity.wait_event::TEXT
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pg_stat_activity.pid <> pg_backend_pid()
  ORDER BY duration_seconds DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- Long-Running Queries
-- =======================

-- Kill long-running queries
CREATE OR REPLACE FUNCTION kill_long_running_queries(p_max_duration_ms INTEGER)
RETURNS TABLE (
  pid INTEGER,
  duration_ms BIGINT,
  query TEXT,
  killed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_activity.pid::INTEGER,
    EXTRACT(MILLISECONDS FROM (NOW() - pg_stat_activity.query_start))::BIGINT AS duration_ms,
    pg_stat_activity.query::TEXT,
    pg_terminate_backend(pg_stat_activity.pid) AS killed
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pg_stat_activity.pid <> pg_backend_pid()
    AND pg_stat_activity.state = 'active'
    AND EXTRACT(MILLISECONDS FROM (NOW() - pg_stat_activity.query_start)) > p_max_duration_ms
    AND pg_stat_activity.query NOT LIKE '%pg_stat_activity%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find long-running queries (without killing)
CREATE OR REPLACE FUNCTION find_long_running_queries(p_min_duration_seconds INTEGER DEFAULT 60)
RETURNS TABLE (
  pid INTEGER,
  username TEXT,
  duration_seconds INTEGER,
  query TEXT,
  state TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_activity.pid::INTEGER,
    pg_stat_activity.usename::TEXT,
    EXTRACT(SECONDS FROM (NOW() - pg_stat_activity.query_start))::INTEGER AS duration_seconds,
    pg_stat_activity.query::TEXT,
    pg_stat_activity.state::TEXT
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pg_stat_activity.pid <> pg_backend_pid()
    AND pg_stat_activity.state = 'active'
    AND EXTRACT(SECONDS FROM (NOW() - pg_stat_activity.query_start)) > p_min_duration_seconds
  ORDER BY duration_seconds DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- Idle Connections
-- =======================

-- Close idle connections
CREATE OR REPLACE FUNCTION close_idle_connections(p_max_idle_ms INTEGER DEFAULT 300000)
RETURNS TABLE (
  pid INTEGER,
  idle_duration_ms BIGINT,
  closed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_activity.pid::INTEGER,
    EXTRACT(MILLISECONDS FROM (NOW() - pg_stat_activity.state_change))::BIGINT AS idle_duration_ms,
    pg_terminate_backend(pg_stat_activity.pid) AS closed
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pg_stat_activity.pid <> pg_backend_pid()
    AND pg_stat_activity.state = 'idle'
    AND EXTRACT(MILLISECONDS FROM (NOW() - pg_stat_activity.state_change)) > p_max_idle_ms
    AND pg_stat_activity.application_name != 'pgbouncer'; -- Don't close pooler connections
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find idle connections
CREATE OR REPLACE FUNCTION find_idle_connections(p_min_idle_seconds INTEGER DEFAULT 300)
RETURNS TABLE (
  pid INTEGER,
  username TEXT,
  idle_duration_seconds INTEGER,
  application_name TEXT,
  client_addr TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_activity.pid::INTEGER,
    pg_stat_activity.usename::TEXT,
    EXTRACT(SECONDS FROM (NOW() - pg_stat_activity.state_change))::INTEGER AS idle_duration_seconds,
    pg_stat_activity.application_name::TEXT,
    pg_stat_activity.client_addr::TEXT
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pg_stat_activity.pid <> pg_backend_pid()
    AND pg_stat_activity.state = 'idle'
    AND EXTRACT(SECONDS FROM (NOW() - pg_stat_activity.state_change)) > p_min_idle_seconds
  ORDER BY idle_duration_seconds DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- Blocking Queries
-- =======================

-- Find queries that are blocking others
CREATE OR REPLACE FUNCTION find_blocking_queries()
RETURNS TABLE (
  blocking_pid INTEGER,
  blocked_pid INTEGER,
  blocking_user TEXT,
  blocked_user TEXT,
  blocking_query TEXT,
  blocked_query TEXT,
  blocking_duration_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kl.pid::INTEGER AS blocking_pid,
    ka.pid::INTEGER AS blocked_pid,
    kl.usename::TEXT AS blocking_user,
    ka.usename::TEXT AS blocked_user,
    kl.query::TEXT AS blocking_query,
    ka.query::TEXT AS blocked_query,
    EXTRACT(SECONDS FROM (NOW() - kl.query_start))::INTEGER AS blocking_duration_seconds
  FROM pg_locks bl
  JOIN pg_stat_activity ka ON ka.pid = bl.pid
  JOIN pg_locks kl ON kl.transactionid = bl.transactionid AND kl.pid != bl.pid
  JOIN pg_stat_activity kl_activity ON kl.pid = kl_activity.pid
  WHERE NOT bl.granted
    AND kl_activity.datname = current_database()
  ORDER BY blocking_duration_seconds DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- Connection Limits
-- =======================

-- Check connection limits and current usage
CREATE OR REPLACE FUNCTION get_connection_limits()
RETURNS TABLE (
  max_connections INTEGER,
  current_connections BIGINT,
  reserved_connections INTEGER,
  available_connections INTEGER,
  usage_percentage DECIMAL
) AS $$
DECLARE
  v_max_conn INTEGER;
  v_reserved INTEGER;
  v_current BIGINT;
BEGIN
  -- Get max connections setting
  SELECT setting::INTEGER INTO v_max_conn
  FROM pg_settings
  WHERE name = 'max_connections';

  -- Get reserved connections (superuser_reserved_connections)
  SELECT setting::INTEGER INTO v_reserved
  FROM pg_settings
  WHERE name = 'superuser_reserved_connections';

  -- Get current connection count
  SELECT COUNT(*) INTO v_current
  FROM pg_stat_activity;

  RETURN QUERY
  SELECT
    v_max_conn AS max_connections,
    v_current AS current_connections,
    v_reserved AS reserved_connections,
    (v_max_conn - v_reserved - v_current::INTEGER) AS available_connections,
    ROUND((v_current::DECIMAL / (v_max_conn - v_reserved)) * 100, 2) AS usage_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- Connection Health Check
-- =======================

-- Comprehensive connection pool health check
CREATE OR REPLACE FUNCTION check_connection_pool_health()
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  status TEXT,
  recommendation TEXT
) AS $$
DECLARE
  v_total BIGINT;
  v_idle BIGINT;
  v_active BIGINT;
  v_max_conn INTEGER;
  v_usage_pct DECIMAL;
  v_long_running BIGINT;
  v_idle_in_transaction BIGINT;
BEGIN
  -- Get connection stats
  SELECT total, idle, active
  INTO v_total, v_idle, v_active
  FROM get_connection_pool_stats();

  -- Get max connections
  SELECT setting::INTEGER INTO v_max_conn
  FROM pg_settings
  WHERE name = 'max_connections';

  -- Calculate usage percentage
  v_usage_pct := ROUND((v_total::DECIMAL / v_max_conn) * 100, 2);

  -- Count long-running queries (>60s)
  SELECT COUNT(*) INTO v_long_running
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND state = 'active'
    AND EXTRACT(SECONDS FROM (NOW() - query_start)) > 60;

  -- Count idle in transaction
  SELECT COUNT(*) INTO v_idle_in_transaction
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND state = 'idle in transaction';

  -- Return health metrics
  RETURN QUERY VALUES
    ('Total Connections', v_total::TEXT,
      CASE WHEN v_usage_pct < 80 THEN 'GOOD' WHEN v_usage_pct < 95 THEN 'WARNING' ELSE 'CRITICAL' END,
      CASE WHEN v_usage_pct >= 80 THEN 'Increase max_connections or reduce load' ELSE 'OK' END),

    ('Idle Connections', v_idle::TEXT,
      CASE WHEN v_idle > v_max_conn * 0.5 THEN 'WARNING' ELSE 'GOOD' END,
      CASE WHEN v_idle > v_max_conn * 0.5 THEN 'Too many idle connections - reduce idle_timeout' ELSE 'OK' END),

    ('Active Connections', v_active::TEXT,
      CASE WHEN v_active < v_max_conn * 0.8 THEN 'GOOD' ELSE 'WARNING' END,
      'OK'),

    ('Pool Usage %', v_usage_pct::TEXT,
      CASE WHEN v_usage_pct < 80 THEN 'GOOD' WHEN v_usage_pct < 95 THEN 'WARNING' ELSE 'CRITICAL' END,
      CASE WHEN v_usage_pct >= 80 THEN 'Scale up connection pool' ELSE 'OK' END),

    ('Long Running Queries', v_long_running::TEXT,
      CASE WHEN v_long_running = 0 THEN 'GOOD' WHEN v_long_running < 5 THEN 'WARNING' ELSE 'CRITICAL' END,
      CASE WHEN v_long_running > 0 THEN 'Investigate and optimize slow queries' ELSE 'OK' END),

    ('Idle in Transaction', v_idle_in_transaction::TEXT,
      CASE WHEN v_idle_in_transaction = 0 THEN 'GOOD' ELSE 'WARNING' END,
      CASE WHEN v_idle_in_transaction > 0 THEN 'Fix application to commit/rollback transactions' ELSE 'OK' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- Usage Examples
-- =======================

/*
-- Check connection pool stats
SELECT * FROM get_connection_pool_stats();

-- Get all active connections
SELECT * FROM get_active_connections();

-- Find long-running queries (>60 seconds)
SELECT * FROM find_long_running_queries(60);

-- Kill queries running for more than 5 minutes
SELECT * FROM kill_long_running_queries(300000);

-- Find idle connections (>5 minutes)
SELECT * FROM find_idle_connections(300);

-- Close idle connections (>10 minutes)
SELECT * FROM close_idle_connections(600000);

-- Find blocking queries
SELECT * FROM find_blocking_queries();

-- Check connection limits
SELECT * FROM get_connection_limits();

-- Comprehensive health check
SELECT * FROM check_connection_pool_health();
*/
