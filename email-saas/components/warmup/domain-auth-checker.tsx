'use client'

// Domain Authentication Checker Component
// Shows SPF, DKIM, DMARC, MX verification status

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Key,
  Mail,
  Server,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'
import { DNSAuthResult } from '@/lib/services/dns-authentication'

interface DomainAuthCheckerProps {
  domain?: string
  authResult?: DNSAuthResult
  onCheck?: (domain: string) => Promise<void>
  loading?: boolean
}

export function DomainAuthChecker({
  domain: initialDomain,
  authResult,
  onCheck,
  loading = false,
}: DomainAuthCheckerProps) {
  const [domain, setDomain] = useState(initialDomain || '')
  const [showDetails, setShowDetails] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCheck = async () => {
    if (domain && onCheck) {
      await onCheck(domain)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Domain Authentication</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify SPF, DKIM, DMARC, and MX records for better deliverability
        </p>
      </div>

      {/* Domain Input */}
      <div className="mb-6 flex gap-3">
        <Input
          placeholder="yourdomain.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={loading}
        />
        <LoadingButton onClick={handleCheck} loading={loading} disabled={!domain}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Check DNS
        </LoadingButton>
      </div>

      {/* Results */}
      {authResult && (
        <>
          {/* Overall Score */}
          <div className="mb-6 rounded-lg border border-purple-500/20 bg-background/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Authentication Score</h4>
              <Badge
                variant={authResult.score === 100 ? 'default' : 'secondary'}
                className={
                  authResult.score === 100
                    ? 'bg-green-500 text-white'
                    : authResult.score >= 70
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }
              >
                {authResult.score}/100
              </Badge>
            </div>
            <Progress value={authResult.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {authResult.score === 100
                ? 'Excellent! All authentication checks passed.'
                : authResult.score >= 70
                ? 'Good, but some improvements needed.'
                : 'Poor authentication. Fix issues to improve deliverability.'}
            </p>
          </div>

          {/* Authentication Checks */}
          <div className="space-y-3 mb-6">
            {/* SPF */}
            <AuthCheck
              icon={<Shield className="h-5 w-5" />}
              name="SPF Record"
              verified={authResult.spf.verified}
              record={authResult.spf.record}
              error={authResult.spf.error}
              details={authResult.spf.details}
              onCopy={(text) => copyToClipboard(text, 'spf')}
              copied={copiedField === 'spf'}
            />

            {/* DKIM */}
            <AuthCheck
              icon={<Key className="h-5 w-5" />}
              name="DKIM Signing"
              verified={authResult.dkim.verified}
              record={authResult.dkim.record}
              error={authResult.dkim.error}
              details={
                authResult.dkim.selector
                  ? `Selector: ${authResult.dkim.selector}`
                  : undefined
              }
              onCopy={(text) => copyToClipboard(text, 'dkim')}
              copied={copiedField === 'dkim'}
            />

            {/* DMARC */}
            <AuthCheck
              icon={<Shield className="h-5 w-5" />}
              name="DMARC Policy"
              verified={authResult.dmarc.verified}
              record={authResult.dmarc.record}
              error={authResult.dmarc.error}
              details={
                authResult.dmarc.policy
                  ? `Policy: ${authResult.dmarc.policy}`
                  : undefined
              }
              onCopy={(text) => copyToClipboard(text, 'dmarc')}
              copied={copiedField === 'dmarc'}
            />

            {/* MX */}
            <AuthCheck
              icon={<Mail className="h-5 w-5" />}
              name="MX Records"
              verified={authResult.mx.verified}
              record={authResult.mx.records.join(', ')}
              error={authResult.mx.error}
              onCopy={(text) => copyToClipboard(text, 'mx')}
              copied={copiedField === 'mx'}
            />
          </div>

          {/* Recommendations */}
          {authResult.recommendations.length > 0 && (
            <div className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-orange-700">
                <AlertCircle className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {authResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-orange-600">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Setup Instructions Toggle */}
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            className="w-full"
          >
            {showDetails ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Hide Setup Instructions
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show Setup Instructions
              </>
            )}
          </Button>

          {/* Setup Instructions */}
          {showDetails && (
            <div className="mt-4 space-y-4">
              <SetupInstructions domain={authResult.domain} />
            </div>
          )}
        </>
      )}
    </Card>
  )
}

// Individual Auth Check Component
function AuthCheck({
  icon,
  name,
  verified,
  record,
  error,
  details,
  onCopy,
  copied,
}: {
  icon: React.ReactNode
  name: string
  verified: boolean
  record: string | null
  error?: string
  details?: string
  onCopy?: (text: string) => void
  copied?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-purple-500/10 bg-background/30 p-3">
      <div className={verified ? 'text-green-500' : 'text-red-500'}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{name}</p>
          {verified ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        {record && (
          <div className="mt-1 flex items-start gap-2">
            <code className="flex-1 rounded bg-muted/50 p-1 text-xs text-muted-foreground break-all">
              {record}
            </code>
            {onCopy && (
              <Button
                onClick={() => onCopy(record)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {details && <p className="mt-1 text-xs text-muted-foreground">{details}</p>}
      </div>
    </div>
  )
}

// Setup Instructions Component
function SetupInstructions({ domain }: { domain: string }) {
  return (
    <div className="space-y-4 rounded-lg border border-purple-500/20 bg-background/50 p-4">
      <h4 className="font-semibold text-foreground">DNS Setup Instructions</h4>

      {/* SPF */}
      <div>
        <h5 className="mb-2 text-sm font-medium text-foreground">SPF Record</h5>
        <div className="rounded bg-muted/50 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Add this TXT record:</p>
          <code className="block text-xs">
            Type: TXT
            <br />
            Name: @<br />
            Value: v=spf1 include:amazonses.com ~all
            <br />
            TTL: 3600
          </code>
        </div>
      </div>

      {/* DKIM */}
      <div>
        <h5 className="mb-2 text-sm font-medium text-foreground">DKIM Setup</h5>
        <div className="rounded bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            DKIM keys are generated by your email provider (e.g., AWS SES). Follow your
            provider's instructions to add the CNAME records to your DNS.
          </p>
        </div>
      </div>

      {/* DMARC */}
      <div>
        <h5 className="mb-2 text-sm font-medium text-foreground">DMARC Policy</h5>
        <div className="rounded bg-muted/50 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Add this TXT record:</p>
          <code className="block text-xs">
            Type: TXT
            <br />
            Name: _dmarc
            <br />
            Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@{domain}; pct=100
            <br />
            TTL: 3600
          </code>
        </div>
      </div>
    </div>
  )
}
