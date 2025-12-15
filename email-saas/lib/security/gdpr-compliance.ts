// GDPR Compliance Features
// Data export, right to deletion, consent tracking, privacy policy enforcement

import { createClient } from '@/lib/supabase/server'

/**
 * Consent Types
 */
export enum ConsentType {
  MARKETING_EMAILS = 'marketing_emails',
  ANALYTICS = 'analytics',
  NECESSARY = 'necessary', // Required for service to function
  PERSONALIZATION = 'personalization',
  THIRD_PARTY_SHARING = 'third_party_sharing',
}

/**
 * Consent Record
 */
export interface ConsentRecord {
  id: string
  user_id: string
  consent_type: ConsentType
  granted: boolean
  granted_at: string | null
  revoked_at: string | null
  ip_address: string
  user_agent: string
  version: string // Privacy policy version
}

/**
 * Data Export Format
 */
export interface UserDataExport {
  user: {
    id: string
    email: string
    created_at: string
    metadata: Record<string, any>
  }
  profile: Record<string, any> | null
  email_accounts: any[]
  email_warmup: any[]
  email_campaigns: any[]
  email_sends: any[]
  consents: ConsentRecord[]
  audit_logs: any[]
  exported_at: string
  format_version: string
}

/**
 * Export all user data in machine-readable format (GDPR Article 20)
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const supabase = await createClient()

  try {
    // Get user basic info
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError) throw userError

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get email accounts
    const { data: emailAccounts } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)

    // Get email warmup data
    const { data: emailWarmup } = await supabase
      .from('email_warmup')
      .select('*')
      .eq('user_id', userId)

    // Get email campaigns
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('user_id', userId)

    // Get email sends (last 90 days for performance)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: emailSends } = await supabase
      .from('email_sends')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())

    // Get consent records
    const { data: consents } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)

    // Get audit logs (last 90 days)
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())

    // Compile export
    const exportData: UserDataExport = {
      user: {
        id: userData.user.id,
        email: userData.user.email!,
        created_at: userData.user.created_at,
        metadata: userData.user.user_metadata,
      },
      profile: profile || null,
      email_accounts: emailAccounts || [],
      email_warmup: emailWarmup || [],
      email_campaigns: campaigns || [],
      email_sends: emailSends || [],
      consents: consents || [],
      audit_logs: auditLogs || [],
      exported_at: new Date().toISOString(),
      format_version: '1.0',
    }

    // Log the export request
    await logAuditEvent(userId, 'data_export_requested', {
      exported_at: exportData.exported_at,
    })

    return exportData
  } catch (error) {
    throw new Error(`Failed to export user data: ${error}`)
  }
}

/**
 * Delete all user data (GDPR Article 17 - Right to Erasure)
 */
export async function deleteUserData(
  userId: string,
  reason?: string
): Promise<{
  success: boolean
  deletedRecords: Record<string, number>
  error?: string
}> {
  const supabase = await createClient()
  const deletedRecords: Record<string, number> = {}

  try {
    // Log deletion request before starting
    await logAuditEvent(userId, 'data_deletion_requested', {
      reason: reason || 'User requested deletion',
      requested_at: new Date().toISOString(),
    })

    // Delete in order (respecting foreign key constraints)

    // 1. Email sends
    const { count: sendsCount } = await supabase
      .from('email_sends')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true })
    deletedRecords.email_sends = sendsCount || 0

    // 2. Email campaigns
    const { count: campaignsCount } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true })
    deletedRecords.email_campaigns = campaignsCount || 0

    // 3. Email warmup
    const { count: warmupCount } = await supabase
      .from('email_warmup')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true })
    deletedRecords.email_warmup = warmupCount || 0

    // 4. Email accounts
    const { count: accountsCount } = await supabase
      .from('email_accounts')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true })
    deletedRecords.email_accounts = accountsCount || 0

    // 5. Consent records
    const { count: consentsCount } = await supabase
      .from('user_consents')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true })
    deletedRecords.user_consents = consentsCount || 0

    // 6. User profile
    const { count: profileCount } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true })
    deletedRecords.user_profiles = profileCount || 0

    // 7. Audit logs (keep deletion record, delete others)
    const { count: auditCount } = await supabase
      .from('audit_logs')
      .delete()
      .eq('user_id', userId)
      .neq('event_type', 'data_deletion_requested')
      .select('*', { count: 'exact', head: true })
    deletedRecords.audit_logs = auditCount || 0

    // 8. Delete user from auth (this cascades to remaining tables)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // Log successful deletion
    await logAuditEvent(userId, 'data_deletion_completed', {
      deleted_records: deletedRecords,
      completed_at: new Date().toISOString(),
    })

    return {
      success: true,
      deletedRecords,
    }
  } catch (error: any) {
    return {
      success: false,
      deletedRecords,
      error: error.message,
    }
  }
}

/**
 * Record user consent
 */
export async function recordConsent(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  metadata: {
    ip_address: string
    user_agent: string
    privacy_policy_version: string
  }
): Promise<ConsentRecord> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_consents')
    .insert({
      user_id: userId,
      consent_type: consentType,
      granted,
      granted_at: granted ? new Date().toISOString() : null,
      revoked_at: granted ? null : new Date().toISOString(),
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      version: metadata.privacy_policy_version,
    })
    .select()
    .single()

  if (error) throw error

  // Log consent event
  await logAuditEvent(userId, granted ? 'consent_granted' : 'consent_revoked', {
    consent_type: consentType,
    version: metadata.privacy_policy_version,
  })

  return data
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Check if user has granted specific consent
 */
export async function hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_consents')
    .select('granted')
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .order('granted_at', { ascending: false })
    .limit(1)
    .single()

  return data?.granted || false
}

/**
 * Revoke consent
 */
export async function revokeConsent(
  userId: string,
  consentType: ConsentType,
  metadata: {
    ip_address: string
    user_agent: string
  }
): Promise<void> {
  await recordConsent(userId, consentType, false, {
    ...metadata,
    privacy_policy_version: await getCurrentPrivacyPolicyVersion(),
  })
}

/**
 * Get current privacy policy version
 */
export async function getCurrentPrivacyPolicyVersion(): Promise<string> {
  // In production, this would fetch from database or config
  return process.env.PRIVACY_POLICY_VERSION || '1.0.0'
}

/**
 * Check if user has accepted current privacy policy
 */
export async function hasAcceptedPrivacyPolicy(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const currentVersion = await getCurrentPrivacyPolicyVersion()

  const { data } = await supabase
    .from('user_consents')
    .select('version, granted')
    .eq('user_id', userId)
    .eq('consent_type', ConsentType.NECESSARY)
    .eq('granted', true)
    .single()

  return data?.version === currentVersion
}

/**
 * Require privacy policy acceptance
 */
export async function requirePrivacyPolicyAcceptance(userId: string): Promise<{
  accepted: boolean
  currentVersion: string
  userVersion?: string
}> {
  const currentVersion = await getCurrentPrivacyPolicyVersion()
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_consents')
    .select('version, granted')
    .eq('user_id', userId)
    .eq('consent_type', ConsentType.NECESSARY)
    .order('granted_at', { ascending: false })
    .limit(1)
    .single()

  const accepted = data?.granted && data.version === currentVersion

  return {
    accepted,
    currentVersion,
    userVersion: data?.version,
  }
}

/**
 * Audit logging helper
 */
async function logAuditEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any>
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('audit_logs').insert({
    user_id: userId,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  })
}

/**
 * Anonymize user data (alternative to deletion)
 * Keeps records for analytics but removes PII
 */
export async function anonymizeUserData(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Generate anonymous ID
    const anonId = `anon_${crypto.randomUUID()}`

    // Anonymize user profile
    await supabase
      .from('user_profiles')
      .update({
        email: `${anonId}@anonymized.local`,
        name: 'Anonymized User',
        phone: null,
        metadata: { anonymized: true },
      })
      .eq('user_id', userId)

    // Anonymize email accounts
    await supabase
      .from('email_accounts')
      .update({
        email: `${anonId}@anonymized.local`,
        smtp_username: anonId,
        smtp_password: null,
      })
      .eq('user_id', userId)

    // Log anonymization
    await logAuditEvent(userId, 'data_anonymized', {
      anonymized_at: new Date().toISOString(),
      anon_id: anonId,
    })

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Data retention policy
 * Delete old data according to retention rules
 */
export async function enforceDataRetention(): Promise<{
  deleted: Record<string, number>
}> {
  const supabase = await createClient()
  const deleted: Record<string, number> = {}

  // Delete email sends older than 1 year
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { count: sendsCount } = await supabase
    .from('email_sends')
    .delete()
    .lt('created_at', oneYearAgo.toISOString())
    .select('*', { count: 'exact', head: true })
  deleted.email_sends = sendsCount || 0

  // Delete audit logs older than 2 years
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const { count: auditCount } = await supabase
    .from('audit_logs')
    .delete()
    .lt('created_at', twoYearsAgo.toISOString())
    .select('*', { count: 'exact', head: true })
  deleted.audit_logs = auditCount || 0

  return { deleted }
}
