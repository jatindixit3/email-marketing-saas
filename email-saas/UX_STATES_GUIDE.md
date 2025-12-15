# UX States Guide - Email Marketing SaaS

Complete guide for implementing polished loading, empty, and success states in your email marketing SaaS application.

## Table of Contents

1. [Loading States](#loading-states)
2. [Empty States](#empty-states)
3. [Success States](#success-states)
4. [Optimistic UI](#optimistic-ui)
5. [Toast Notifications](#toast-notifications)
6. [Confetti Animations](#confetti-animations)
7. [Best Practices](#best-practices)
8. [File Reference](#file-reference)

---

## Loading States

### 1. Skeleton Loaders

Use skeleton loaders for initial page loads and data fetching.

**File:** [components/ui/loading-skeleton.tsx](components/ui/loading-skeleton.tsx)

#### Available Skeletons:

```tsx
import {
  CampaignTableSkeleton,
  ContactTableSkeleton,
  AnalyticsSkeleton,
  ListSelectorSkeleton,
  TemplateGallerySkeleton,
  CardSkeleton,
  FormSkeleton,
} from '@/components/ui/loading-skeleton'

// Usage in page
export default function CampaignsPage() {
  const { data, isLoading } = useCampaigns()

  if (isLoading) {
    return <CampaignTableSkeleton />
  }

  return <CampaignTable data={data} />
}
```

#### When to Use:
- Initial page loads
- Data table loading
- Card grid loading
- Form initialization
- Any predictable layout loading

---

### 2. Spinners

Use spinners for indeterminate loading states.

**File:** [components/ui/loading-spinner.tsx](components/ui/loading-spinner.tsx)

#### Available Spinners:

```tsx
import {
  Spinner,
  ButtonSpinner,
  PageSpinner,
  CardSpinner,
  InlineSpinner,
  OverlaySpinner,
  DotsSpinner,
  PulseSpinner,
} from '@/components/ui/loading-spinner'

// Page-level loading
<PageSpinner />

// Card loading
<CardSpinner message="Loading campaign data..." />

// Overlay existing content
<div className="relative">
  <YourContent />
  <OverlaySpinner message="Updating..." />
</div>

// Inline with text
<p>Processing <InlineSpinner /> your request...</p>
```

#### When to Use:
- Full page loading (initial app load)
- Card/section loading
- Overlay loading (updating existing content)
- Inline loading indicators

---

### 3. Loading Buttons

Use loading buttons for actions that trigger async operations.

**File:** [components/ui/loading-button.tsx](components/ui/loading-button.tsx)

```tsx
import { LoadingButton } from '@/components/ui/loading-button'

function SendCampaignButton() {
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setLoading(true)
    try {
      await sendCampaign()
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoadingButton
      loading={loading}
      loadingText="Sending..."
      onClick={handleSend}
    >
      Send Campaign
    </LoadingButton>
  )
}
```

#### Features:
- Disabled during loading
- Optional loading text
- Automatic spinner icon
- Prevents double-clicks

---

### 4. Progress Bars

Use progress bars for operations with measurable progress.

**File:** [components/ui/progress-states.tsx](components/ui/progress-states.tsx)

#### Upload Progress:

```tsx
import { UploadProgress } from '@/components/ui/progress-states'

<UploadProgress
  progress={75}
  total={100}
  current={75}
  status="uploading" // or "completed" | "error"
  message="Uploading contacts..."
  error="Upload failed" // optional, shown on error
/>
```

#### Campaign Send Progress:

```tsx
import { SendProgress } from '@/components/ui/progress-states'

<SendProgress
  progress={50}
  total={10000}
  current={5000}
  status="sending" // or "completed"
  message="Sending campaign..."
/>
```

#### Step Progress (Multi-step Forms):

```tsx
import { StepProgress } from '@/components/ui/progress-states'

<StepProgress
  currentStep={2}
  totalSteps={4}
  steps={['Details', 'Recipients', 'Design', 'Review']}
/>
```

#### Export Progress:

```tsx
import { ExportProgress } from '@/components/ui/progress-states'

<ExportProgress
  progress={80}
  total={5000}
  status="processing" // or "completed"
  message="Exporting contacts..."
/>
```

#### Inline Progress (Compact):

```tsx
import { InlineProgress } from '@/components/ui/progress-states'

<InlineProgress
  progress={60}
  message="Uploading... 60%"
/>
```

#### When to Use:
- File uploads (CSV import)
- Batch email sending
- Export operations
- Multi-step form wizards
- Any measurable async operation

---

## Empty States

Beautiful, actionable empty states that guide users.

**File:** [components/ui/empty-state.tsx](components/ui/empty-state.tsx)

### 1. No Campaigns

```tsx
import { NoCampaignsEmptyState } from '@/components/ui/empty-state'

<NoCampaignsEmptyState
  onCreateCampaign={() => router.push('/dashboard/campaigns/new')}
/>
```

### 2. No Contacts

```tsx
import { NoContactsEmptyState } from '@/components/ui/empty-state'

<NoContactsEmptyState
  onImport={() => setShowImportDialog(true)}
  onAddManually={() => setShowAddContactDialog(true)}
/>
```

**Features:**
- Import guide with requirements
- Two CTAs (import and manual add)

### 3. No Templates

```tsx
import { NoTemplatesEmptyState } from '@/components/ui/empty-state'

<NoTemplatesEmptyState
  onCreateTemplate={() => router.push('/dashboard/templates/new')}
/>
```

### 4. No Search Results

```tsx
import { NoSearchResultsEmptyState } from '@/components/ui/empty-state'

<NoSearchResultsEmptyState
  query={searchQuery}
  onClear={() => setSearchQuery('')}
/>
```

**Features:**
- Shows what was searched
- Helpful search tips
- Clear button

### 5. No Lists

```tsx
import { NoListsEmptyState } from '@/components/ui/empty-state'

<NoListsEmptyState
  onCreateList={() => setShowCreateListDialog(true)}
/>
```

### 6. No Analytics Data

```tsx
import { NoAnalyticsEmptyState } from '@/components/ui/empty-state'

<NoAnalyticsEmptyState />
```

### 7. Generic Empty State

```tsx
import { EmptyState } from '@/components/ui/empty-state'

<EmptyState
  icon={Mail}
  title="No drafts yet"
  description="Save campaign drafts to work on them later"
  action={{
    label: 'Create Draft',
    onClick: () => createDraft()
  }}
  secondaryAction={{
    label: 'Learn More',
    onClick: () => openHelp()
  }}
/>
```

### 8. Compact No Data State

```tsx
import { NoDataState } from '@/components/ui/empty-state'

<NoDataState
  icon={Inbox}
  message="No data available"
/>
```

#### Design Features:
- Gradient background with border
- Animated icon with glow effect
- Clear title and description
- Primary and secondary CTAs
- Contextual guidance (e.g., import guide)

---

## Success States

Celebrate user achievements with delightful success states.

**File:** [components/ui/success-state.tsx](components/ui/success-state.tsx)

### 1. Campaign Sent Success

```tsx
import { CampaignSentSuccess } from '@/components/ui/success-state'

<CampaignSentSuccess
  recipientCount={1500}
  onViewAnalytics={() => router.push('/dashboard/analytics')}
  onCreateAnother={() => router.push('/dashboard/campaigns/new')}
/>
```

**Features:**
- Recipient count stat
- Estimated delivery time
- Two CTAs (view analytics, create another)

### 2. First Campaign Success (with Confetti)

```tsx
import { FirstCampaignSuccess } from '@/components/ui/success-state'
import { ConfettiExplosion } from '@/components/ui/confetti'

<>
  <FirstCampaignSuccess
    onViewAnalytics={() => router.push('/dashboard/analytics')}
    onLearnMore={() => window.open('/docs/best-practices')}
  />
  <ConfettiExplosion trigger={true} />
</>
```

**Features:**
- Animated gradient heading
- Milestone badge
- "What's Next?" section with checklist
- Celebration animation

### 3. Contacts Imported Success

```tsx
import { ContactsImportedSuccess } from '@/components/ui/success-state'

<ContactsImportedSuccess
  importedCount={2500}
  skippedCount={50}
  onViewContacts={() => router.push('/dashboard/contacts')}
  onImportMore={() => setShowImportDialog(true)}
/>
```

**Features:**
- Imported and skipped counts
- Two CTAs

### 4. Template Saved Success (Compact)

```tsx
import { TemplateSavedSuccess } from '@/components/ui/success-state'

<TemplateSavedSuccess
  onClose={() => setShowSuccess(false)}
/>
```

### 5. Generic Success State

```tsx
import { SuccessState } from '@/components/ui/success-state'

<SuccessState
  title="List Created!"
  description="Your new contact list is ready to use"
  stats={[
    { label: 'Contacts', value: '0' },
    { label: 'Lists', value: '5' },
  ]}
  action={{
    label: 'View List',
    onClick: () => router.push(`/dashboard/lists/${listId}`)
  }}
/>
```

### 6. Inline Success Message

```tsx
import { InlineSuccessMessage } from '@/components/ui/success-state'

<InlineSuccessMessage message="Campaign scheduled successfully!" />
```

---

## Optimistic UI

Create instant, responsive UI that syncs with the server.

### 1. Optimistic Update Hook

**File:** [hooks/use-optimistic-update.ts](hooks/use-optimistic-update.ts)

```tsx
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update'

function ContactList() {
  const { data: contacts, isPending, update } = useOptimisticUpdate(
    initialContacts,
    {
      onSuccess: (contacts) => toast.success('Contacts updated'),
      onError: (error) => toast.error(error.message),
      rollbackOnError: true, // Auto-rollback on failure
    }
  )

  const addContact = async (newContact) => {
    update(
      [...contacts, newContact], // Optimistic update
      () => api.addContact(newContact) // Async action
    )
  }

  return (
    <div>
      {contacts.map(contact => <ContactCard key={contact.id} {...contact} />)}
      {isPending && <Badge>Syncing...</Badge>}
    </div>
  )
}
```

### 2. Optimistic List Hook

**File:** [hooks/use-optimistic-update.ts](hooks/use-optimistic-update.ts)

```tsx
import { useOptimisticList } from '@/hooks/use-optimistic-update'

function ContactManager() {
  const {
    items: contacts,
    isPending,
    addItem,
    removeItem,
    updateItem,
    removeItems,
  } = useOptimisticList(initialContacts, {
    onSuccess: () => toast.success('Changes saved'),
    onError: (error) => toast.error(error.message),
  })

  // Add contact
  const handleAdd = async (contact) => {
    const optimisticContact = {
      id: generateOptimisticId(), // Temporary ID
      ...contact,
    }
    await addItem(optimisticContact, () => api.addContact(contact))
  }

  // Delete contact
  const handleDelete = async (id) => {
    await removeItem(id, () => api.deleteContact(id))
  }

  // Update contact
  const handleUpdate = async (id, updates) => {
    await updateItem(id, updates, () => api.updateContact(id, updates))
  }

  // Bulk delete
  const handleBulkDelete = async (ids) => {
    await removeItems(ids, () => api.bulkDelete(ids))
  }

  return <ContactTable contacts={contacts} isPending={isPending} />
}
```

### 3. Optimistic Mutation Hook

```tsx
import { useOptimisticMutation } from '@/hooks/use-optimistic-update'

function SendCampaignButton({ campaignId }) {
  const { mutate, isPending } = useOptimisticMutation(
    (id) => api.sendCampaign(id),
    {
      onMutate: () => console.log('Sending...'),
      onSuccess: (data) => toast.success(`Sent to ${data.recipientCount}`),
      onError: (error) => toast.error(error.message),
    }
  )

  return (
    <LoadingButton
      loading={isPending}
      onClick={() => mutate(campaignId)}
    >
      Send Campaign
    </LoadingButton>
  )
}
```

### 4. Optimistic Helper Utilities

**File:** [lib/utils/optimistic-helpers.ts](lib/utils/optimistic-helpers.ts)

```tsx
import {
  generateOptimisticId,
  isOptimisticId,
  optimisticList,
} from '@/lib/utils/optimistic-helpers'

// Generate temp ID
const tempId = generateOptimisticId() // "optimistic-1234567890-abc123"

// Check if ID is optimistic
isOptimisticId('optimistic-123') // true
isOptimisticId('real-server-id') // false

// List operations
const contacts = [{ id: '1', email: 'test@example.com' }]

// Add
const withNew = optimisticList.add(contacts, { id: '2', email: 'new@example.com' })

// Remove
const withoutOne = optimisticList.remove(contacts, '1')

// Update
const updated = optimisticList.update(contacts, '1', { email: 'updated@example.com' })

// Bulk remove
const withoutMany = optimisticList.removeMany(contacts, ['1', '2'])

// Reorder
const reordered = optimisticList.reorder(contacts, 0, 2)
```

---

## Toast Notifications

Pre-configured toast helpers for common scenarios.

**File:** [lib/utils/toast-helpers.tsx](lib/utils/toast-helpers.tsx)

### Success Toasts

```tsx
import { toastSuccess } from '@/lib/utils/toast-helpers'

// Campaign
toastSuccess.campaignSent(1500) // "Campaign Sent! 🎉"
toastSuccess.campaignScheduled('Dec 25, 2024 at 9:00 AM')
toastSuccess.campaignSaved()

// Contacts
toastSuccess.contactsImported(2500, 50) // with skipped count
toastSuccess.contactAdded()
toastSuccess.contactsDeleted(10)

// Lists
toastSuccess.listCreated('Newsletter Subscribers')
toastSuccess.listUpdated()

// Templates
toastSuccess.templateSaved()

// Export
toastSuccess.exportReady()

// Generic
toastSuccess.success('Operation completed!')
```

### Error Toasts

```tsx
import { toastError } from '@/lib/utils/toast-helpers'

// Campaign
toastError.campaignSendFailed('Network error')
toastError.rateLimitExceeded(100)

// Contacts
toastError.importFailed('Invalid CSV format')
toastError.invalidEmail()

// Validation
toastError.validationFailed('Email is required')

// Auth
toastError.unauthorized()

// Generic
toastError.error('Something went wrong')
toastError.networkError()
```

### Warning Toasts

```tsx
import { toastWarning } from '@/lib/utils/toast-helpers'

toastWarning.duplicateFound(5)
toastWarning.unsavedChanges()
toastWarning.warning('Custom warning message')
```

### Info Toasts

```tsx
import { toastInfo } from '@/lib/utils/toast-helpers'

toastInfo.processing('Analyzing contacts...')
toastInfo.info('Campaign is scheduled')
```

### Promise Toast (Auto-handles states)

```tsx
import { toastPromise } from '@/lib/utils/toast-helpers'

await toastPromise(
  sendCampaign(campaignId),
  {
    loading: 'Sending campaign...',
    success: (data) => `Sent to ${data.recipientCount} recipients`,
    error: (err) => err.message || 'Failed to send campaign',
  }
)
```

**Features:**
- Shows loading toast during promise
- Updates to success on resolve
- Updates to error on reject
- Automatic dismissal

### Manual Loading Toast

```tsx
import { toastLoading } from '@/lib/utils/toast-helpers'

const loadingToast = toastLoading.start('Uploading...')

// ... do work

toastLoading.update(loadingToast, true, 'Upload complete!')
// or
toastLoading.dismiss(loadingToast)
```

---

## Confetti Animations

Celebrate milestones with delightful confetti animations.

**File:** [components/ui/confetti.tsx](components/ui/confetti.tsx)

### 1. Basic Confetti

```tsx
import { Confetti } from '@/components/ui/confetti'

<Confetti trigger={showConfetti} onComplete={() => console.log('Done!')} />
```

### 2. Explosion Confetti

```tsx
import { ConfettiExplosion } from '@/components/ui/confetti'

<ConfettiExplosion trigger={true} />
```

### 3. Realistic Confetti (15 second continuous)

```tsx
import { RealisticConfetti } from '@/components/ui/confetti'

<RealisticConfetti trigger={true} />
```

### 4. Stars Confetti

```tsx
import { StarsConfetti } from '@/components/ui/confetti'

<StarsConfetti trigger={true} />
```

### 5. Fireworks Confetti

```tsx
import { FireworksConfetti } from '@/components/ui/confetti'

<FireworksConfetti trigger={true} />
```

### 6. School Pride (from bottom)

```tsx
import { SchoolPrideConfetti } from '@/components/ui/confetti'

<SchoolPrideConfetti trigger={true} />
```

### 7. Trigger Function (Programmatic)

```tsx
import { triggerConfetti } from '@/components/ui/confetti'

// In event handler
const handleSendCampaign = async () => {
  await sendCampaign()
  triggerConfetti('explosion') // 'basic' | 'explosion' | 'realistic' | 'stars' | 'fireworks'
}
```

### When to Use Confetti:

- ✅ First campaign sent
- ✅ Major milestone achieved (1000 contacts, 100 campaigns, etc.)
- ✅ Completed onboarding
- ✅ Plan upgrade
- ❌ Don't overuse - reserve for truly special moments

---

## Best Practices

### Loading States

1. **Use Skeletons for Predictable Layouts**
   - Tables, cards, grids should use skeletons
   - Match skeleton structure to actual content

2. **Use Spinners for Indeterminate Loading**
   - Button actions
   - Unpredictable content
   - Full page initial loads

3. **Show Progress for Measurable Operations**
   - File uploads
   - Batch processing
   - Email sending

4. **Provide Context**
   - Always include a message: "Uploading contacts..." not just a spinner
   - Show counts when possible: "Sent 500 of 1,000 emails"

### Empty States

1. **Always Provide Next Steps**
   - Include a clear CTA
   - Explain what the user should do

2. **Add Context**
   - Explain why it's empty
   - Show examples or guides when helpful

3. **Make Them Beautiful**
   - Use gradient backgrounds
   - Include icons
   - Match brand colors

### Success States

1. **Celebrate Milestones**
   - Use confetti for first-time achievements
   - Show stats and metrics

2. **Provide Next Actions**
   - Don't leave users wondering "what's next?"
   - Offer 1-2 relevant CTAs

3. **Be Timely**
   - Show success immediately after action
   - Auto-dismiss toasts after 3-5 seconds

### Optimistic UI

1. **Always Provide Rollback**
   - Enable `rollbackOnError: true`
   - Show error toasts on failure

2. **Indicate Pending State**
   - Show "Syncing..." badge
   - Use optimistic IDs for new items

3. **Handle Errors Gracefully**
   - Roll back to previous state
   - Show clear error message
   - Allow retry

4. **Visual Feedback**
   - Highlight optimistic items (subtle background)
   - Show loading indicators during sync

### Toast Notifications

1. **Duration Guidelines**
   - Success: 3-5 seconds
   - Error: 5-7 seconds
   - Info/Warning: 4-5 seconds
   - Loading: Infinity (manually dismiss)

2. **Message Quality**
   - Be specific: "Campaign sent to 1,500 recipients" not "Success"
   - Include actionable info when relevant
   - Use friendly, human language

3. **Don't Overuse**
   - Not every action needs a toast
   - Batch related operations
   - Use inline messages for form validation

### Performance

1. **Debounce Optimistic Updates**
   - For rapid user actions (typing, dragging)
   - Use `debounceOptimistic` helper

2. **Lazy Load Heavy Components**
   - Confetti animations
   - Large datasets
   - Complex visualizations

3. **Minimize Re-renders**
   - Memoize callbacks
   - Use proper React keys
   - Optimize optimistic update logic

---

## File Reference

### Loading States
- **[components/ui/loading-skeleton.tsx](components/ui/loading-skeleton.tsx)** - Skeleton loaders for all layouts
- **[components/ui/loading-spinner.tsx](components/ui/loading-spinner.tsx)** - Spinner components
- **[components/ui/loading-button.tsx](components/ui/loading-button.tsx)** - Button with loading state
- **[components/ui/progress-states.tsx](components/ui/progress-states.tsx)** - Progress bars and step indicators

### Empty States
- **[components/ui/empty-state.tsx](components/ui/empty-state.tsx)** - All empty state components

### Success States
- **[components/ui/success-state.tsx](components/ui/success-state.tsx)** - Success state components
- **[components/ui/confetti.tsx](components/ui/confetti.tsx)** - Confetti animations

### Optimistic UI
- **[hooks/use-optimistic-update.ts](hooks/use-optimistic-update.ts)** - Optimistic update hooks
- **[lib/utils/optimistic-helpers.ts](lib/utils/optimistic-helpers.ts)** - Helper utilities

### Notifications
- **[lib/utils/toast-helpers.tsx](lib/utils/toast-helpers.tsx)** - Toast notification helpers

### Examples
- **[app/dashboard/campaigns/example-states/page.tsx](app/dashboard/campaigns/example-states/page.tsx)** - Demo of all UX states
- **[app/dashboard/contacts/example-optimistic/page.tsx](app/dashboard/contacts/example-optimistic/page.tsx)** - Demo of optimistic UI

### Dependencies
- **shadcn/ui**: skeleton, toast, progress, button, card, input, badge
- **canvas-confetti**: Confetti animations
- **lucide-react**: Icons

---

## Examples

Visit these pages to see all states in action:

1. **All UX States Demo**: `/dashboard/campaigns/example-states`
   - Loading states (skeletons, spinners, progress)
   - Empty states (campaigns, contacts, search)
   - Success states (sent, first campaign)
   - Toast notifications
   - Confetti animations

2. **Optimistic UI Demo**: `/dashboard/contacts/example-optimistic`
   - Add contacts instantly
   - Delete with rollback on error
   - Bulk operations
   - Real-time syncing indicators

---

## Quick Start

### 1. Add Toaster to Root Layout

```tsx
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### 2. Use in Your Pages

```tsx
'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'
import { CampaignTableSkeleton } from '@/components/ui/loading-skeleton'
import { NoCampaignsEmptyState } from '@/components/ui/empty-state'
import { toastSuccess, toastPromise } from '@/lib/utils/toast-helpers'

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useCampaigns()
  const [sending, setSending] = useState(false)

  const handleSend = async (id) => {
    await toastPromise(
      sendCampaign(id),
      {
        loading: 'Sending campaign...',
        success: 'Campaign sent successfully!',
        error: 'Failed to send campaign'
      }
    )
  }

  if (isLoading) return <CampaignTableSkeleton />
  if (campaigns.length === 0) {
    return <NoCampaignsEmptyState onCreateCampaign={() => router.push('/new')} />
  }

  return (
    <div>
      {campaigns.map(campaign => (
        <LoadingButton
          key={campaign.id}
          onClick={() => handleSend(campaign.id)}
        >
          Send
        </LoadingButton>
      ))}
    </div>
  )
}
```

---

## Color Theme

All components use your existing brand colors:
- **Primary**: Teal (`#14b8a6`, `from-teal-500`)
- **Secondary**: Purple (`#a855f7`, `to-purple-500`)
- **Success**: Green (`#10b981`)
- **Error**: Red (`#ef4444`)

Gradient backgrounds:
```css
bg-gradient-to-br from-teal-500/5 to-purple-500/5
border-purple-500/20
```

---

## Support

For issues or questions:
- View example pages: `/dashboard/campaigns/example-states` and `/dashboard/contacts/example-optimistic`
- Check component files in `components/ui/`
- Review this guide

---

Built with ❤️ for your email marketing SaaS
