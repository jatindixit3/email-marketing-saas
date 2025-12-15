// Optimized Database Queries
// Production-ready queries with proper indexing, pagination, and N+1 prevention

import { createClient } from '@/lib/supabase/server'

/**
 * Pagination Configuration
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

/**
 * Campaigns - Optimized Queries
 */

// Get user's campaigns with pagination and filtering
export async function getCampaigns(
  userId: string,
  params: {
    status?: string
    page?: number
    limit?: number
    sortBy?: 'created_at' | 'sent_at' | 'scheduled_at' | 'name'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<PaginationResult<any>> {
  const supabase = await createClient()

  const page = Math.max(1, params.page || DEFAULT_PAGE)
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = (page - 1) * limit
  const sortBy = params.sortBy || 'created_at'
  const sortOrder = params.sortOrder || 'desc'

  // Build query with specific fields (avoid SELECT *)
  let query = supabase
    .from('campaigns')
    .select(
      `
      id,
      name,
      subject,
      status,
      scheduled_at,
      sent_at,
      recipient_count,
      emails_sent,
      emails_delivered,
      emails_opened,
      emails_clicked,
      open_rate,
      click_rate,
      bounce_rate,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// Get campaign with related data (eager loading to avoid N+1)
export async function getCampaignWithRelations(campaignId: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      template:templates(id, name),
      campaign_lists(
        list:lists(
          id,
          name,
          contact_count
        )
      )
    `
    )
    .eq('id', campaignId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

// Get campaigns ready to send (uses idx_campaigns_ready_to_send)
export async function getCampaignsReadyToSend() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, user_id, name, subject, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })
    .limit(100) // Process in batches

  if (error) throw error
  return data || []
}

/**
 * Contacts - Optimized Queries
 */

// Get user's contacts with pagination and filtering
export async function getContacts(
  userId: string,
  params: {
    status?: string
    listId?: string
    search?: string
    page?: number
    limit?: number
  } = {}
): Promise<PaginationResult<any>> {
  const supabase = await createClient()

  const page = Math.max(1, params.page || DEFAULT_PAGE)
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = (page - 1) * limit

  // Build query with specific fields
  let query = supabase
    .from('contacts')
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      status,
      last_engaged_at,
      created_at,
      subscribed_at
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // Search by email or name (uses idx_contacts_user_search)
  if (params.search) {
    query = query.or(
      `email.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`
    )
  }

  // Filter by list
  if (params.listId) {
    // Join with list_contacts
    query = supabase
      .from('list_contacts')
      .select(
        `
        contact:contacts(
          id,
          email,
          first_name,
          last_name,
          status,
          last_engaged_at,
          created_at,
          subscribed_at
        )
      `,
        { count: 'exact' }
      )
      .eq('list_id', params.listId)
  }

  // Apply sorting and pagination
  query = query.order('created_at', { ascending: false })
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  // Extract contacts if filtered by list
  const contacts = params.listId
    ? (data || []).map((item: any) => item.contact).filter(Boolean)
    : data || []

  return {
    data: contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// Get contact with engagement history (eager loading)
export async function getContactWithEngagement(contactId: string, userId: string) {
  const supabase = await createClient()

  // Get contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (contactError) throw contactError

  // Get recent events in single query
  const { data: events, error: eventsError } = await supabase
    .from('email_events')
    .select(
      `
      id,
      event_type,
      created_at,
      campaign:campaigns(id, name)
    `
    )
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (eventsError) throw eventsError

  // Get lists contact belongs to
  const { data: lists, error: listsError } = await supabase
    .from('list_contacts')
    .select('list:lists(id, name)')
    .eq('contact_id', contactId)

  if (listsError) throw listsError

  return {
    ...contact,
    recentEvents: events || [],
    lists: (lists || []).map((item: any) => item.list).filter(Boolean),
  }
}

// Bulk contact operations (batch processing)
export async function bulkAddContactsToList(
  contactIds: string[],
  listId: string
): Promise<{ success: number; failed: number }> {
  const supabase = await createClient()

  // Prepare batch insert
  const records = contactIds.map((contactId) => ({
    list_id: listId,
    contact_id: contactId,
  }))

  // Insert in batches of 500 (Supabase limit)
  const batchSize = 500
  let success = 0
  let failed = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const { error } = await supabase
      .from('list_contacts')
      .insert(batch)
      .select()

    if (error) {
      failed += batch.length
    } else {
      success += batch.length
    }
  }

  return { success, failed }
}

/**
 * Email Events - Optimized Queries
 */

// Get campaign events with aggregation
export async function getCampaignEvents(
  campaignId: string,
  params: {
    eventType?: string
    page?: number
    limit?: number
  } = {}
): Promise<PaginationResult<any>> {
  const supabase = await createClient()

  const page = Math.max(1, params.page || DEFAULT_PAGE)
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = (page - 1) * limit

  let query = supabase
    .from('email_events')
    .select(
      `
      id,
      event_type,
      created_at,
      link_url,
      device_type,
      email_client,
      contact:contacts(id, email, first_name, last_name)
    `,
      { count: 'exact' }
    )
    .eq('campaign_id', campaignId)

  if (params.eventType) {
    query = query.eq('event_type', params.eventType)
  }

  query = query.order('created_at', { ascending: false })
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// Get campaign analytics (optimized aggregation)
export async function getCampaignAnalytics(campaignId: string) {
  const supabase = await createClient()

  // Get all analytics in parallel
  const [campaignData, eventsData, topLinksData, deviceData] = await Promise.all([
    // Campaign basic stats
    supabase
      .from('campaigns')
      .select(
        `
        id,
        name,
        subject,
        status,
        sent_at,
        recipient_count,
        emails_sent,
        emails_delivered,
        emails_opened,
        emails_clicked,
        emails_bounced,
        emails_unsubscribed,
        open_rate,
        click_rate,
        bounce_rate,
        unsubscribe_rate
      `
      )
      .eq('id', campaignId)
      .single(),

    // Event counts by type
    supabase.rpc('get_event_counts_by_type', { p_campaign_id: campaignId }),

    // Top clicked links
    supabase.rpc('get_top_links', { p_campaign_id: campaignId, p_limit: 10 }),

    // Device breakdown
    supabase.rpc('get_device_breakdown', { p_campaign_id: campaignId }),
  ])

  return {
    campaign: campaignData.data,
    events: eventsData.data,
    topLinks: topLinksData.data,
    devices: deviceData.data,
  }
}

/**
 * Lists - Optimized Queries
 */

// Get user's lists with contact counts (uses idx_lists_user_id)
export async function getLists(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lists')
    .select(
      `
      id,
      name,
      description,
      contact_count,
      created_at,
      updated_at
    `
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Dashboard Analytics - Optimized Queries
 */

// Get user dashboard stats (optimized with parallel queries)
export async function getDashboardStats(userId: string) {
  const supabase = await createClient()

  const [
    contactsData,
    campaignsData,
    recentCampaignsData,
    engagementData,
  ] = await Promise.all([
    // Contact stats
    supabase
      .from('contacts')
      .select('status', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'subscribed')
      .is('deleted_at', null),

    // Campaign stats
    supabase
      .from('campaigns')
      .select('status', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),

    // Recent campaigns (last 30 days)
    supabase
      .from('campaigns')
      .select(
        `
        id,
        name,
        status,
        sent_at,
        emails_sent,
        open_rate,
        click_rate
      `
      )
      .eq('user_id', userId)
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .is('deleted_at', null)
      .order('sent_at', { ascending: false })
      .limit(5),

    // Overall engagement metrics
    supabase.rpc('get_user_engagement_metrics', { p_user_id: userId }),
  ])

  return {
    totalContacts: contactsData.count || 0,
    totalCampaigns: campaignsData.count || 0,
    recentCampaigns: recentCampaignsData.data || [],
    engagement: engagementData.data,
  }
}

/**
 * Search - Optimized Full-Text Search
 */

// Search campaigns by name (uses idx_campaigns_name_search)
export async function searchCampaigns(userId: string, searchTerm: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, subject, status, created_at')
    .eq('user_id', userId)
    .textSearch('name', searchTerm, { type: 'websearch', config: 'english' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

/**
 * Batch Operations - Optimized for Performance
 */

// Batch update campaign stats (called periodically)
export async function batchUpdateCampaignStats(campaignIds: string[]) {
  const supabase = await createClient()

  // Update stats for each campaign
  for (const campaignId of campaignIds) {
    await supabase.rpc('update_campaign_stats_optimized', {
      p_campaign_id: campaignId,
    })
  }
}

/**
 * Query Utilities
 */

// Check if query result is empty
export function isEmpty<T>(result: PaginationResult<T>): boolean {
  return result.data.length === 0
}

// Transform pagination params from URL
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '25'), MAX_LIMIT),
  }
}
