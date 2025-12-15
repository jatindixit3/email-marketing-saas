'use client'

// Email Best Practices Guide Component
// Comprehensive guide for email marketing best practices

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Mail,
  Users,
  Target,
  Shield,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  Zap,
  Heart,
  BarChart,
} from 'lucide-react'

export function BestPracticesGuide() {
  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Email Marketing Best Practices</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow these guidelines to maximize deliverability and engagement
        </p>
      </div>

      <div className="space-y-6">
        {/* List Building */}
        <PracticeSection
          icon={<Users className="h-5 w-5" />}
          title="List Building & Management"
          badge="Critical"
          badgeColor="bg-red-500"
          practices={[
            {
              title: 'Use Double Opt-In',
              description: 'Require users to confirm their email address before adding them to your list. This reduces spam complaints and bounces.',
              doThis: ['Send a confirmation email with a verification link', 'Only add confirmed subscribers to your list', 'Keep records of opt-in dates and IPs'],
              dontThis: ['Never buy or rent email lists', 'Don\'t add people without permission', 'Avoid pre-checked opt-in boxes'],
            },
            {
              title: 'Clean Your List Regularly',
              description: 'Remove inactive and invalid contacts to maintain good sender reputation.',
              doThis: ['Remove hard bounces immediately', 'Re-engage inactive subscribers before removing them', 'Validate email formats before adding'],
              dontThis: ['Don\'t keep sending to unengaged contacts for months', 'Never ignore bounce notifications', 'Don\'t send to role addresses (info@, support@)'],
            },
            {
              title: 'Easy Unsubscribe Process',
              description: 'Make it simple for recipients to opt out. It\'s better than spam complaints.',
              doThis: ['Include unsubscribe link in every email', 'Honor unsubscribe requests within 24-48 hours', 'Offer preference center for partial opt-out'],
              dontThis: ['Don\'t hide the unsubscribe link', 'Never require login to unsubscribe', 'Don\'t send "We\'re sorry to see you go" emails after unsubscribe'],
            },
          ]}
        />

        {/* Content & Design */}
        <PracticeSection
          icon={<FileText className="h-5 w-5" />}
          title="Content & Design"
          badge="Important"
          badgeColor="bg-orange-500"
          practices={[
            {
              title: 'Craft Compelling Subject Lines',
              description: 'Your subject line determines if your email gets opened.',
              doThis: ['Keep it under 50 characters', 'Personalize when possible', 'Create urgency without being spammy', 'A/B test different variations'],
              dontThis: ['Avoid ALL CAPS and excessive punctuation!!!', 'Don\'t use spam trigger words (FREE, URGENT, ACT NOW)', 'Never mislead recipients'],
            },
            {
              title: 'Balance Text and Images',
              description: 'Too many images can trigger spam filters and hurt accessibility.',
              doThis: ['Use 60% text, 40% images ratio', 'Always include alt text for images', 'Ensure email is readable with images disabled', 'Keep HTML under 102KB'],
              dontThis: ['Don\'t create image-only emails', 'Avoid large image files (>200KB)', 'Never put critical info only in images'],
            },
            {
              title: 'Mobile Optimization',
              description: 'Over 50% of emails are opened on mobile devices.',
              doThis: ['Use responsive design', 'Keep subject lines under 40 characters', 'Use large, touch-friendly buttons (44x44px min)', 'Test on multiple devices'],
              dontThis: ['Don\'t use small fonts (<14px)', 'Avoid multi-column layouts', 'Never use Flash or complex animations'],
            },
          ]}
        />

        {/* Sending Practices */}
        <PracticeSection
          icon={<Clock className="h-5 w-5" />}
          title="Sending Practices"
          badge="Important"
          badgeColor="bg-yellow-500"
          practices={[
            {
              title: 'Timing & Frequency',
              description: 'When and how often you send impacts engagement.',
              doThis: ['Test different send times for your audience', 'Maintain consistent sending schedule', 'Respect user frequency preferences', 'Avoid weekends for B2B'],
              dontThis: ['Don\'t send the same email multiple times', 'Avoid sending too frequently (>3x/week for most lists)', 'Never send at odd hours (2-5 AM)'],
            },
            {
              title: 'Segmentation & Personalization',
              description: 'Relevant content drives higher engagement.',
              doThis: ['Segment by demographics, behavior, engagement', 'Personalize beyond just first name', 'Send targeted content to each segment', 'Use dynamic content blocks'],
              dontThis: ['Don\'t send the same message to everyone', 'Avoid generic "Dear Customer" greetings', 'Never make assumptions about recipients'],
            },
            {
              title: 'During Warmup Period',
              description: 'Special considerations for new accounts.',
              doThis: ['Start with your most engaged subscribers', 'Increase volume gradually (as per warmup schedule)', 'Monitor engagement metrics closely', 'Stop if bounce rate exceeds 2%'],
              dontThis: ['Don\'t send to your entire list on day 1', 'Avoid sending to cold/old contacts during warmup', 'Never ignore warmup limits'],
            },
          ]}
        />

        {/* Technical Setup */}
        <PracticeSection
          icon={<Shield className="h-5 w-5" />}
          title="Technical Setup"
          badge="Critical"
          badgeColor="bg-red-500"
          practices={[
            {
              title: 'Authentication (SPF, DKIM, DMARC)',
              description: 'Proper authentication is essential for deliverability.',
              doThis: ['Set up SPF record to authorize sending servers', 'Enable DKIM signing for all emails', 'Implement DMARC with p=quarantine or p=reject', 'Use consistent From domain'],
              dontThis: ['Don\'t send without SPF/DKIM', 'Avoid using free email domains (gmail.com) as From address', 'Never spoof or fake sender information'],
            },
            {
              title: 'Tracking & Analytics',
              description: 'Measure what matters to improve your campaigns.',
              doThis: ['Track opens, clicks, bounces, unsubscribes', 'Use UTM parameters for link tracking', 'Monitor sender reputation regularly', 'Set up conversion tracking'],
              dontThis: ['Don\'t track without user consent (GDPR)', 'Avoid tracking pixels in every image', 'Never share tracking data with third parties without consent'],
            },
          ]}
        />

        {/* Compliance */}
        <PracticeSection
          icon={<AlertCircle className="h-5 w-5" />}
          title="Legal Compliance"
          badge="Critical"
          badgeColor="bg-red-500"
          practices={[
            {
              title: 'CAN-SPAM & GDPR Compliance',
              description: 'Follow email marketing laws to avoid penalties.',
              doThis: ['Include physical mailing address in footer', 'Honor opt-outs within 10 business days (CAN-SPAM)', 'Obtain explicit consent for EU contacts (GDPR)', 'Keep records of consent'],
              dontThis: ['Never send without consent', 'Don\'t use deceptive subject lines', 'Avoid hiding your identity', 'Never charge fees to unsubscribe'],
            },
          ]}
        />

        {/* Engagement Optimization */}
        <PracticeSection
          icon={<TrendingUp className="h-5 w-5" />}
          title="Maximizing Engagement"
          badge="Recommended"
          badgeColor="bg-teal-500"
          practices={[
            {
              title: 'Re-engagement Campaigns',
              description: 'Win back inactive subscribers before removing them.',
              doThis: ['Send re-engagement email after 3-6 months inactivity', 'Offer incentive to re-engage', 'Ask if they want to stay subscribed', 'Remove non-responders after 2-3 attempts'],
              dontThis: ['Don\'t keep emailing forever', 'Avoid aggressive re-engagement tactics', 'Never guilt-trip subscribers'],
            },
            {
              title: 'A/B Testing',
              description: 'Test to learn what resonates with your audience.',
              doThis: ['Test one variable at a time', 'Use statistically significant sample sizes', 'Test subject lines, CTAs, send times, content', 'Apply learnings to future campaigns'],
              dontThis: ['Don\'t test without a hypothesis', 'Avoid testing too many variables at once', 'Never ignore test results'],
            },
          ]}
        />
      </div>

      {/* Summary Checklist */}
      <div className="mt-8 rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-teal-700">
          <CheckCircle2 className="h-5 w-5" />
          Quick Checklist Before Sending
        </h4>
        <ul className="space-y-2 text-sm text-teal-600">
          <li>✅ All recipients have explicitly opted in</li>
          <li>✅ SPF, DKIM, and DMARC are configured</li>
          <li>✅ Unsubscribe link is visible and functional</li>
          <li>✅ Subject line is clear and not spammy</li>
          <li>✅ Email is mobile-responsive</li>
          <li>✅ All links are working and tracked</li>
          <li>✅ Physical address is in footer</li>
          <li>✅ Content provides value to recipients</li>
          <li>✅ You're within warmup limits (if applicable)</li>
          <li>✅ Email has been tested and previewed</li>
        </ul>
      </div>
    </Card>
  )
}

// Practice Section Component
function PracticeSection({
  icon,
  title,
  badge,
  badgeColor,
  practices,
}: {
  icon: React.ReactNode
  title: string
  badge: string
  badgeColor: string
  practices: {
    title: string
    description: string
    doThis: string[]
    dontThis: string[]
  }[]
}) {
  return (
    <div className="rounded-lg border border-purple-500/20 bg-background/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-purple-500">{icon}</div>
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        <Badge className={`${badgeColor} text-white`}>{badge}</Badge>
      </div>

      <div className="space-y-4">
        {practices.map((practice, index) => (
          <div key={index} className="rounded-lg bg-background/50 p-3">
            <h5 className="mb-1 font-medium text-foreground">{practice.title}</h5>
            <p className="mb-3 text-sm text-muted-foreground">{practice.description}</p>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Do This */}
              <div className="rounded border border-green-500/30 bg-green-500/5 p-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Do This
                </p>
                <ul className="space-y-1">
                  {practice.doThis.map((item, i) => (
                    <li key={i} className="text-xs text-green-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Don't Do This */}
              <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  Don't Do This
                </p>
                <ul className="space-y-1">
                  {practice.dontThis.map((item, i) => (
                    <li key={i} className="text-xs text-red-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
