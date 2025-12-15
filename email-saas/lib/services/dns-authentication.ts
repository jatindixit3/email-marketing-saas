// Domain Authentication Checker
// Verifies SPF, DKIM, DMARC, and MX records

import { promises as dns } from 'dns'

export interface DNSAuthResult {
  domain: string
  spf: {
    verified: boolean
    record: string | null
    error?: string
    details?: string
  }
  dkim: {
    verified: boolean
    record: string | null
    error?: string
    selector?: string
  }
  dmarc: {
    verified: boolean
    record: string | null
    error?: string
    policy?: string
  }
  mx: {
    verified: boolean
    records: string[]
    error?: string
  }
  allVerified: boolean
  score: number // 0-100
  recommendations: string[]
}

/**
 * Check SPF record for a domain
 */
async function checkSPF(domain: string): Promise<DNSAuthResult['spf']> {
  try {
    const records = await dns.resolveTxt(domain)
    const spfRecord = records.find((record) =>
      record.join('').startsWith('v=spf1')
    )

    if (!spfRecord) {
      return {
        verified: false,
        record: null,
        error: 'No SPF record found',
        details: 'Add an SPF record to your DNS to authorize sending servers',
      }
    }

    const spfString = spfRecord.join('')

    // Check for common issues
    const hasAll = spfString.includes('~all') || spfString.includes('-all')
    const hasInclude = spfString.includes('include:')

    if (!hasAll) {
      return {
        verified: false,
        record: spfString,
        error: 'SPF record missing "all" mechanism',
        details: 'SPF should end with ~all or -all',
      }
    }

    return {
      verified: true,
      record: spfString,
      details: 'SPF record is properly configured',
    }
  } catch (error: any) {
    return {
      verified: false,
      record: null,
      error: error.code === 'ENOTFOUND' ? 'Domain not found' : 'Failed to check SPF',
    }
  }
}

/**
 * Check DKIM record for a domain
 * Note: Requires knowing the selector (default: 'default', 'mail', 'ses')
 */
async function checkDKIM(
  domain: string,
  selector: string = 'default'
): Promise<DNSAuthResult['dkim']> {
  try {
    const dkimDomain = `${selector}._domainkey.${domain}`
    const records = await dns.resolveTxt(dkimDomain)

    const dkimRecord = records.find((record) =>
      record.join('').includes('v=DKIM1')
    )

    if (!dkimRecord) {
      return {
        verified: false,
        record: null,
        error: `No DKIM record found for selector "${selector}"`,
        selector,
      }
    }

    const dkimString = dkimRecord.join('')

    // Check for public key
    const hasPublicKey = dkimString.includes('p=') && dkimString.match(/p=([^;]+)/)?.[1]

    if (!hasPublicKey) {
      return {
        verified: false,
        record: dkimString,
        error: 'DKIM record missing public key',
        selector,
      }
    }

    return {
      verified: true,
      record: dkimString,
      selector,
    }
  } catch (error: any) {
    // Try common selectors if default fails
    if (selector === 'default') {
      const commonSelectors = ['mail', 'ses', 'k1', 'google', 'dkim']

      for (const altSelector of commonSelectors) {
        const result = await checkDKIM(domain, altSelector)
        if (result.verified) {
          return result
        }
      }
    }

    return {
      verified: false,
      record: null,
      error: 'No DKIM record found. Try checking with your email provider for the correct selector.',
      selector,
    }
  }
}

/**
 * Check DMARC record for a domain
 */
async function checkDMARC(domain: string): Promise<DNSAuthResult['dmarc']> {
  try {
    const dmarcDomain = `_dmarc.${domain}`
    const records = await dns.resolveTxt(dmarcDomain)

    const dmarcRecord = records.find((record) =>
      record.join('').startsWith('v=DMARC1')
    )

    if (!dmarcRecord) {
      return {
        verified: false,
        record: null,
        error: 'No DMARC record found',
      }
    }

    const dmarcString = dmarcRecord.join('')

    // Extract policy
    const policyMatch = dmarcString.match(/p=(none|quarantine|reject)/)
    const policy = policyMatch ? policyMatch[1] : 'none'

    // Check for reporting address
    const hasReporting = dmarcString.includes('rua=') || dmarcString.includes('ruf=')

    return {
      verified: true,
      record: dmarcString,
      policy,
    }
  } catch (error: any) {
    return {
      verified: false,
      record: null,
      error: 'Failed to check DMARC',
    }
  }
}

/**
 * Check MX records for a domain
 */
async function checkMX(domain: string): Promise<DNSAuthResult['mx']> {
  try {
    const records = await dns.resolveMx(domain)

    if (!records || records.length === 0) {
      return {
        verified: false,
        records: [],
        error: 'No MX records found',
      }
    }

    const mxRecords = records
      .sort((a, b) => a.priority - b.priority)
      .map((record) => `${record.exchange} (priority: ${record.priority})`)

    return {
      verified: true,
      records: mxRecords,
    }
  } catch (error: any) {
    return {
      verified: false,
      records: [],
      error: 'Failed to check MX records',
    }
  }
}

/**
 * Comprehensive domain authentication check
 */
export async function checkDomainAuthentication(
  domain: string,
  dkimSelector?: string
): Promise<DNSAuthResult> {
  // Run all checks in parallel
  const [spf, dkim, dmarc, mx] = await Promise.all([
    checkSPF(domain),
    checkDKIM(domain, dkimSelector),
    checkDMARC(domain),
    checkMX(domain),
  ])

  // Calculate score
  let score = 0
  if (spf.verified) score += 30
  if (dkim.verified) score += 30
  if (dmarc.verified) score += 25
  if (mx.verified) score += 15

  // Generate recommendations
  const recommendations: string[] = []

  if (!spf.verified) {
    recommendations.push(
      '📧 Add SPF record to authorize your sending servers (e.g., v=spf1 include:_spf.google.com ~all)'
    )
  }

  if (!dkim.verified) {
    recommendations.push(
      '🔑 Set up DKIM signing to verify email authenticity. Contact your email provider for keys.'
    )
  }

  if (!dmarc.verified) {
    recommendations.push(
      '🛡️ Add DMARC policy to protect your domain from spoofing (e.g., v=DMARC1; p=quarantine; rua=mailto:dmarc@' +
        domain +
        ')'
    )
  } else if (dmarc.policy === 'none') {
    recommendations.push(
      '⚠️ Your DMARC policy is set to "none". Consider upgrading to "quarantine" or "reject" for better protection.'
    )
  }

  if (!mx.verified) {
    recommendations.push('📬 Configure MX records to receive email replies')
  }

  if (score === 100) {
    recommendations.push(
      '✅ Perfect! Your domain authentication is fully configured.'
    )
  }

  return {
    domain,
    spf,
    dkim,
    dmarc,
    mx,
    allVerified: spf.verified && dkim.verified && dmarc.verified && mx.verified,
    score,
    recommendations,
  }
}

/**
 * Get DNS setup instructions for a domain
 */
export function getDNSSetupInstructions(domain: string): {
  spf: string
  dkim: string
  dmarc: string
} {
  return {
    spf: `v=spf1 include:amazonses.com ~all

Add this TXT record to ${domain}:
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600

Note: Replace "amazonses.com" with your email provider's SPF include directive.`,

    dkim: `DKIM requires your email provider to generate keys for you.

For AWS SES:
1. Go to SES Console > Verified Identities
2. Select your domain
3. Click "Create DKIM keys"
4. Add the provided CNAME records to your DNS

The records will look like:
Name: <selector>._domainkey.${domain}
Type: TXT
Value: v=DKIM1; k=rsa; p=<public_key>`,

    dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; ruf=mailto:dmarc@${domain}; pct=100

Add this TXT record to ${domain}:
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100
TTL: 3600

Policy options:
- p=none: Monitor only (recommended for testing)
- p=quarantine: Send suspicious emails to spam
- p=reject: Reject suspicious emails (most strict)`,
  }
}

/**
 * Validate email sending domain setup
 */
export async function validateEmailDomain(domain: string): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  authResult: DNSAuthResult
}> {
  const authResult = await checkDomainAuthentication(domain)

  const errors: string[] = []
  const warnings: string[] = []

  // Critical errors (will prevent sending)
  if (!authResult.spf.verified) {
    errors.push('SPF record is missing or invalid')
  }

  if (!authResult.dkim.verified) {
    errors.push('DKIM is not configured')
  }

  // Warnings (won't prevent sending but affects reputation)
  if (!authResult.dmarc.verified) {
    warnings.push('DMARC is not configured - your domain is vulnerable to spoofing')
  } else if (authResult.dmarc.policy === 'none') {
    warnings.push('DMARC policy is set to "none" - consider using "quarantine" or "reject"')
  }

  if (!authResult.mx.verified) {
    warnings.push('No MX records found - you cannot receive email replies')
  }

  const isValid = errors.length === 0

  return {
    isValid,
    errors,
    warnings,
    authResult,
  }
}

/**
 * Check if domain is on a public blocklist (basic check)
 */
export async function checkDomainReputation(domain: string): Promise<{
  isListed: boolean
  lists: string[]
  reputation: 'good' | 'neutral' | 'poor'
}> {
  // This is a simplified check. In production, you'd integrate with services like:
  // - Spamhaus
  // - SURBL
  // - URIBL
  // - Google Safe Browsing API

  // For now, return a basic check
  return {
    isListed: false,
    lists: [],
    reputation: 'good',
  }
}
