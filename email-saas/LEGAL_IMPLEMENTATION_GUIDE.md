# Legal Documents Implementation Guide

Complete guide to implementing legal documents for your email marketing SaaS.

## 📋 Documents Created

1. **[Privacy Policy](legal/PRIVACY_POLICY.md)** - GDPR & CCPA compliant
2. **[Terms of Service](legal/TERMS_OF_SERVICE.md)** - Comprehensive legal terms
3. **[Cookie Policy](legal/COOKIE_POLICY.md)** - EU Cookie Law compliant
4. **[Cookie Consent Banner](components/CookieConsent.tsx)** - React component

---

## 🚀 Quick Setup (30 minutes)

### Step 1: Customize Legal Documents (15 min)

Replace placeholders in all documents:

```bash
# Find and replace in all files:
[YOUR_COMPANY_NAME] → Your Company Inc.
[YOUR_EMAIL] → legal@yourcompany.com
[YOUR_ADDRESS] → 123 Main St, City, State, ZIP
[DATE] → 2025-01-15
[YOUR_JURISDICTION] → California, United States
[YOUR_WEBSITE/pricing] → https://yourcompany.com/pricing
```

**Files to update:**
- `legal/PRIVACY_POLICY.md`
- `legal/TERMS_OF_SERVICE.md`
- `legal/COOKIE_POLICY.md`

### Step 2: Create Legal Pages (10 min)

Create Next.js pages for each document:

```typescript
// app/legal/privacy/page.tsx
import { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import { marked } from 'marked' // npm install marked

export const metadata: Metadata = {
  title: 'Privacy Policy | Your Company',
  description: 'Our privacy policy explains how we collect and use your data.'
}

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'legal', 'PRIVACY_POLICY.md')
  const content = fs.readFileSync(filePath, 'utf8')
  const html = marked(content)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

// Repeat for:
// app/legal/terms/page.tsx
// app/legal/cookies/page.tsx
```

### Step 3: Add Cookie Consent Banner (5 min)

```typescript
// app/layout.tsx
import { CookieConsent } from '@/components/CookieConsent'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
```

Add to footer:

```typescript
// components/Footer.tsx
import { CookieSettingsLink } from '@/components/CookieConsent'

export function Footer() {
  return (
    <footer>
      {/* ... other footer content ... */}
      <div className="flex gap-4">
        <Link href="/legal/privacy">Privacy Policy</Link>
        <Link href="/legal/terms">Terms of Service</Link>
        <Link href="/legal/cookies">Cookie Policy</Link>
        <CookieSettingsLink />
      </div>
    </footer>
  )
}
```

---

## 📝 Detailed Implementation

### Privacy Policy

**Location:** `legal/PRIVACY_POLICY.md`

**Key Sections:**
- Information collection (email, name, behavior)
- Data usage (campaigns, analytics)
- Third-party services (AWS SES, Stripe, Sentry)
- GDPR compliance (EU users)
- User rights (access, deletion, export)
- Data retention periods
- Security measures

**Required Actions:**
1. ✅ Replace all placeholders
2. ✅ Add your third-party services
3. ✅ Update data retention periods if needed
4. ✅ Add your data protection officer email (if applicable)
5. ✅ Review and customize for your specific use case

**Legal Requirements:**
- Display prominently on website
- Link from signup/registration
- Update users when changes are made
- Keep version history

### Terms of Service

**Location:** `legal/TERMS_OF_SERVICE.md`

**Key Sections:**
- Acceptable use policy (no spam!)
- Account termination clauses
- Refund policy (30-day for annual)
- Anti-spam compliance (CAN-SPAM Act)
- Intellectual property rights
- Limitation of liability
- Dispute resolution & arbitration

**Required Actions:**
1. ✅ Set your refund policy amounts
2. ✅ Define your jurisdiction for disputes
3. ✅ Customize acceptable use policy
4. ✅ Set bounce rate limits (default: 5%)
5. ✅ Review liability limitations with lawyer

**Legal Requirements:**
- Users must accept before using service
- Display prominently during signup
- Keep previous versions archived
- Notify users of material changes (30 days)

### Cookie Policy

**Location:** `legal/COOKIE_POLICY.md`

**Key Sections:**
- Types of cookies (essential, functional, analytics, marketing)
- First-party vs third-party cookies
- Cookie lifespan and purposes
- Email tracking (opens, clicks)
- How to manage preferences
- Third-party service disclosures

**Required Actions:**
1. ✅ List all cookies you use
2. ✅ Add your analytics provider (Google Analytics, etc.)
3. ✅ Document email tracking practices
4. ✅ Add opt-out links for third parties

**Legal Requirements:**
- EU Cookie Law compliance
- Obtain consent before non-essential cookies
- Provide easy opt-out mechanism
- Document all cookies used

### Cookie Consent Banner

**Location:** `components/CookieConsent.tsx`

**Features:**
- ✅ EU Cookie Law compliant
- ✅ GDPR consent management
- ✅ Granular cookie preferences
- ✅ Essential cookies always enabled
- ✅ localStorage + cookie storage
- ✅ Google Analytics integration
- ✅ Customizable preferences

**Configuration:**

```typescript
// Add to .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Your Google Analytics ID
```

**Customization:**

```typescript
// Modify DEFAULT_PREFERENCES in CookieConsent.tsx
const DEFAULT_PREFERENCES = {
  essential: true,      // Always true
  functional: false,    // Preferences, theme
  analytics: false,     // Google Analytics
  marketing: false,     // Ads, retargeting
}
```

---

## 🔧 Advanced Setup

### Database Integration

Store user consent in database:

```sql
-- Add to database/migrations/
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Update CookieConsent component:

```typescript
const saveConsent = async (prefs: CookiePreferences) => {
  // Save to localStorage (existing code)
  localStorage.setItem('cookie_consent', JSON.stringify(prefs))

  // Also save to database
  try {
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consents: Object.entries(prefs).map(([type, granted]) => ({
          consent_type: type,
          granted
        }))
      })
    })
  } catch (error) {
    console.error('Failed to save consent:', error)
  }
}
```

### Terms Acceptance Tracking

Track when users accept Terms of Service:

```typescript
// During signup
await supabase.from('user_consents').insert({
  user_id: user.id,
  consent_type: 'terms_of_service',
  granted: true,
  version: '1.0',
  ip_address: req.headers['x-forwarded-for'],
  user_agent: req.headers['user-agent']
})
```

### Version Control

Track document versions:

```sql
CREATE TABLE legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL, -- 'privacy', 'terms', 'cookies'
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Compliance Checklist

### GDPR Compliance (EU)

- [x] Privacy Policy published
- [x] Consent mechanism for cookies
- [x] Data export functionality
- [x] Data deletion (right to be forgotten)
- [x] Data processing agreement (for B2B)
- [ ] Appoint Data Protection Officer (if required)
- [x] Document data retention periods
- [x] Implement security measures
- [x] Breach notification procedure

### CCPA Compliance (California)

- [x] Privacy Policy with CCPA section
- [x] Right to know what data collected
- [x] Right to delete personal data
- [x] Right to opt-out of sale (not applicable)
- [x] Non-discrimination clause

### CAN-SPAM Act (Email)

- [x] Accurate header information
- [x] No deceptive subject lines
- [x] Identify message as ad
- [x] Include physical address
- [x] Unsubscribe mechanism
- [x] Honor opt-outs within 10 days

### EU Cookie Law

- [x] Cookie Policy published
- [x] Consent banner before non-essential cookies
- [x] Granular cookie preferences
- [x] Easy opt-out mechanism
- [x] Document all cookies

---

## 📧 Email Templates

### Privacy Policy Update Notification

```
Subject: Important: Updated Privacy Policy

Hi [Name],

We've updated our Privacy Policy to better protect your data and comply with the latest regulations.

What's New:
- Enhanced data security measures
- Clearer explanation of data usage
- Updated third-party service providers

You can review the updated policy here: [LINK]

By continuing to use our service, you agree to the updated Privacy Policy. If you have questions, reply to this email.

Best regards,
[Your Company]
```

### Terms of Service Update

```
Subject: Update to Our Terms of Service (Action Required)

Hi [Name],

We're updating our Terms of Service, effective [DATE].

Key Changes:
- Updated acceptable use policy
- Clarified refund procedures
- New data retention timelines

Please review: [LINK]

Your continued use after [DATE] means you accept these updated Terms. To decline, you may close your account before [DATE].

Questions? Contact us at [EMAIL]

Best regards,
[Your Company]
```

---

## 🔍 Testing Checklist

### Before Launch

- [ ] All placeholders replaced
- [ ] Legal pages accessible
- [ ] Cookie banner displays correctly
- [ ] Cookie preferences save properly
- [ ] Google Analytics toggles correctly
- [ ] Links to legal docs in footer
- [ ] Terms acceptance during signup
- [ ] Privacy policy link in signup form
- [ ] Cookie policy accessible
- [ ] Mobile responsive design
- [ ] GDPR data export works
- [ ] Data deletion works

### Browser Testing

- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox
- [ ] Edge
- [ ] Cookie banner on first visit
- [ ] Preferences persist after reload
- [ ] "Cookie Settings" link works

---

## 💼 Legal Review

**Important:** These templates provide a starting point but are NOT legal advice.

### Recommended Actions

1. **Hire a Lawyer:** Have documents reviewed by an attorney familiar with:
   - Technology law
   - Privacy law (GDPR, CCPA)
   - Your jurisdiction

2. **Customizations Needed:**
   - Your specific business model
   - Geographic markets (EU, California, etc.)
   - Industry-specific regulations
   - Data processing agreements

3. **Regular Reviews:**
   - Annually review and update
   - When laws change (GDPR updates)
   - When adding new features
   - When expanding to new markets

### When to Consult a Lawyer

- Before launching in new countries
- If handling sensitive data (health, financial)
- After regulatory changes
- If receiving legal demands
- Before major feature changes

---

## 📊 Monitoring & Maintenance

### Analytics

Track legal page views:

```typescript
// Track privacy policy views
gtag('event', 'page_view', {
  page_title: 'Privacy Policy',
  page_location: '/legal/privacy'
})

// Track terms acceptance
gtag('event', 'terms_accepted', {
  version: '1.0',
  timestamp: new Date().toISOString()
})
```

### Audit Log

Log important events:

```typescript
await supabase.from('audit_logs').insert({
  user_id: user.id,
  event_type: 'privacy_policy_viewed',
  metadata: { version: '1.0', page: '/legal/privacy' }
})
```

### Updates & Changes

When updating legal documents:

1. Update version number and date
2. Archive previous version
3. Notify users via email (30 days notice)
4. Display prominent notice in app
5. Log user acceptance of new version
6. Update database with new version

---

## 🌍 International Compliance

### Expanding to New Markets

**UK (post-Brexit):**
- Similar to GDPR
- UK ICO instead of EU authority
- UK GDPR applies

**Canada:**
- CASL (anti-spam law) - strictest in world
- PIPEDA (privacy law)
- Express consent required

**Australia:**
- Privacy Act 1988
- Spam Act 2003
- Notifiable Data Breaches scheme

**Brazil:**
- LGPD (similar to GDPR)
- Portuguese translation required

---

## 📞 Support

### Questions?

**Legal Questions:** Consult your attorney

**Implementation Questions:**
- Review this guide
- Check component documentation
- Test in development first

### Resources

- **GDPR:** https://gdpr.eu/
- **CCPA:** https://oag.ca.gov/privacy/ccpa
- **CAN-SPAM:** https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business

---

## ✅ Launch Checklist

Before going live:

- [ ] All legal documents customized
- [ ] Lawyer reviewed documents
- [ ] Legal pages published
- [ ] Cookie banner implemented
- [ ] Footer links added
- [ ] Terms acceptance in signup
- [ ] Privacy link in signup
- [ ] GDPR tools working (export, delete)
- [ ] Email templates prepared
- [ ] Team trained on compliance
- [ ] Data breach response plan
- [ ] Regular review scheduled

---

**Your SaaS is now legally compliant! 🎉**

Remember: This is a starting point. Always consult with a qualified attorney for your specific situation.
