// Database Connection Pool Configuration
// Optimized for Supabase with Prisma or direct PostgreSQL

import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Connection Pool Configuration
 *
 * Supabase uses PgBouncer for connection pooling by default
 * Connection string format:
 * - Direct: postgresql://[user]:[password]@[host]:5432/[db]
 * - Pooler: postgresql://[user]:[password]@[host]:6543/[db]?pgbouncer=true
 */

export const connectionPoolConfig = {
  /**
   * Connection Pool Settings
   */
  pool: {
    // Maximum number of connections in the pool
    max: parseInt(process.env.DATABASE_POOL_MAX || '20'),

    // Minimum number of connections to maintain
    min: parseInt(process.env.DATABASE_POOL_MIN || '2'),

    // Maximum time (ms) a connection can be idle before being released
    idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000'),

    // Maximum time (ms) to wait for a connection
    connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_CONNECTION_TIMEOUT || '10000'),

    // Maximum lifetime (ms) of a connection (prevents memory leaks)
    maxLifetimeMillis: parseInt(process.env.DATABASE_POOL_MAX_LIFETIME || '1800000'), // 30 min
  },

  /**
   * Statement Timeout
   * Prevents long-running queries from blocking connections
   */
  statement_timeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '60000'), // 60s

  /**
   * Connection Retries
   */
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1s
    maxDelay: 5000, // 5s
  },
}

/**
 * Get optimized Supabase client with connection pooling
 */
export function getOptimizedSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Disable session persistence for server-side
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-connection-pool': 'enabled',
      },
    },
  })
}

/**
 * Connection Pool Monitoring
 */
export interface PoolStats {
  total: number
  idle: number
  active: number
  waiting: number
}

/**
 * Monitor connection pool health
 * Run this periodically to detect connection leaks
 */
export async function monitorConnectionPool(): Promise<{
  healthy: boolean
  stats: PoolStats
  warnings: string[]
}> {
  const supabase = getOptimizedSupabaseClient()
  const warnings: string[] = []

  try {
    // Query pg_stat_activity to get connection stats
    const { data, error } = await supabase.rpc('get_connection_pool_stats')

    if (error) {
      return {
        healthy: false,
        stats: { total: 0, idle: 0, active: 0, waiting: 0 },
        warnings: ['Failed to query connection stats'],
      }
    }

    const stats: PoolStats = data || { total: 0, idle: 0, active: 0, waiting: 0 }

    // Check for potential issues
    const { pool } = connectionPoolConfig

    // Warning: Too many active connections
    if (stats.active > pool.max * 0.8) {
      warnings.push(`High active connections: ${stats.active}/${pool.max}`)
    }

    // Warning: Too many waiting connections
    if (stats.waiting > 5) {
      warnings.push(`Connections waiting: ${stats.waiting}`)
    }

    // Warning: All connections in use
    if (stats.active >= pool.max) {
      warnings.push('Connection pool exhausted')
    }

    return {
      healthy: warnings.length === 0,
      stats,
      warnings,
    }
  } catch (error) {
    return {
      healthy: false,
      stats: { total: 0, idle: 0, active: 0, waiting: 0 },
      warnings: ['Exception monitoring pool: ' + error],
    }
  }
}

/**
 * Database function to get connection pool stats
 * Create this function in PostgreSQL:
 */
export const connectionPoolStatsSQL = `
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
`

/**
 * Find and kill long-running queries
 */
export async function killLongRunningQueries(maxDurationMs: number = 60000) {
  const supabase = getOptimizedSupabaseClient()

  const { data, error } = await supabase.rpc('kill_long_running_queries', {
    p_max_duration_ms: maxDurationMs,
  })

  if (error) {
    console.error('Failed to kill long-running queries:', error)
    return []
  }

  return data || []
}

export const killLongRunningQueriesSQL = `
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
    pg_stat_activity.query,
    pg_terminate_backend(pg_stat_activity.pid) AS killed
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pg_stat_activity.pid <> pg_backend_pid()
    AND pg_stat_activity.state = 'active'
    AND EXTRACT(MILLISECONDS FROM (NOW() - pg_stat_activity.query_start)) > p_max_duration_ms
    AND pg_stat_activity.query NOT LIKE '%pg_stat_activity%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

/**
 * Close idle connections
 */
export async function closeIdleConnections(maxIdleTimeMs: number = 300000) {
  const supabase = getOptimizedSupabaseClient()

  const { data, error } = await supabase.rpc('close_idle_connections', {
    p_max_idle_ms: maxIdleTimeMs,
  })

  if (error) {
    console.error('Failed to close idle connections:', error)
    return []
  }

  return data || []
}

export const closeIdleConnectionsSQL = `
CREATE OR REPLACE FUNCTION close_idle_connections(p_max_idle_ms INTEGER)
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
    AND EXTRACT(MILLISECONDS FROM (NOW() - pg_stat_activity.state_change)) > p_max_idle_ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

/**
 * Connection Pool Best Practices
 */
export const connectionPoolBestPractices = {
  /**
   * 1. Use connection pooling in production
   * - Set DATABASE_URL to use port 6543 (pooler) instead of 5432 (direct)
   * - For Supabase: Use the "Connection Pooling" connection string
   */
  productionUrl: 'postgresql://[user]:[password]@[host]:6543/[db]?pgbouncer=true',

  /**
   * 2. Configure pool size based on workload
   * - Default: 20 connections max
   * - High traffic: 40-100 connections
   * - Low traffic: 10-20 connections
   * - Formula: (Core Count * 2) + Effective Spindle Count
   */
  recommendedPoolSize: {
    low: 10,
    medium: 20,
    high: 40,
    veryHigh: 100,
  },

  /**
   * 3. Set appropriate timeouts
   * - Connection timeout: 10s (fail fast)
   * - Statement timeout: 60s (prevent blocking)
   * - Idle timeout: 30s (release unused connections)
   */
  recommendedTimeouts: {
    connection: 10000,
    statement: 60000,
    idle: 30000,
  },

  /**
   * 4. Monitor and alert
   * - Track active connections
   * - Alert when pool > 80% utilized
   * - Monitor for connection leaks
   */
  monitoringThresholds: {
    warning: 0.8, // 80% of max connections
    critical: 0.95, // 95% of max connections
  },

  /**
   * 5. Prevent connection leaks
   * - Always close connections after use
   * - Use try/finally blocks
   * - Set max connection lifetime
   * - Implement health checks
   */
  preventLeaks: [
    'Use connection pooling',
    'Set maxLifetimeMillis',
    'Monitor idle connections',
    'Implement connection cleanup',
  ],
}

/**
 * Environment Variable Template
 */
export const environmentVariableTemplate = `
# Database Connection Pool Configuration

# Direct connection (for migrations, admin tasks)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Pooled connection (for application queries)
DATABASE_POOL_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true

# Pool Configuration
DATABASE_POOL_MAX=20                    # Maximum connections
DATABASE_POOL_MIN=2                     # Minimum connections
DATABASE_POOL_IDLE_TIMEOUT=30000        # 30s idle timeout
DATABASE_POOL_CONNECTION_TIMEOUT=10000  # 10s connection timeout
DATABASE_POOL_MAX_LIFETIME=1800000      # 30min max lifetime
DATABASE_STATEMENT_TIMEOUT=60000        # 60s statement timeout
`
