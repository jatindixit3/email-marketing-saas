# UX States Quick Reference

Quick copy-paste snippets for common UX patterns.

## 🔄 Loading States

### Table Loading
```tsx
import { CampaignTableSkeleton } from '@/components/ui/loading-skeleton'

{isLoading ? <CampaignTableSkeleton /> : <CampaignTable data={data} />}
```

### Button Loading
```tsx
import { LoadingButton } from '@/components/ui/loading-button'

<LoadingButton loading={isLoading} onClick={handleClick}>
  Send Campaign
</LoadingButton>
```

### Upload Progress
```tsx
import { UploadProgress } from '@/components/ui/progress-states'

<UploadProgress
  progress={progress}
  total={total}
  current={current}
  status="uploading"
  message="Uploading contacts..."
/>
```

### Full Page Loading
```tsx
import { PageSpinner } from '@/components/ui/loading-spinner'

{isLoading && <PageSpinner />}
```

---

## 📭 Empty States

### No Campaigns
```tsx
import { NoCampaignsEmptyState } from '@/components/ui/empty-state'

{campaigns.length === 0 && (
  <NoCampaignsEmptyState
    onCreateCampaign={() => router.push('/campaigns/new')}
  />
)}
```

### No Contacts
```tsx
import { NoContactsEmptyState } from '@/components/ui/empty-state'

<NoContactsEmptyState
  onImport={() => setShowImport(true)}
  onAddManually={() => setShowAdd(true)}
/>
```

### No Search Results
```tsx
import { NoSearchResultsEmptyState } from '@/components/ui/empty-state'

<NoSearchResultsEmptyState
  query={searchQuery}
  onClear={() => setSearchQuery('')}
/>
```

---

## ✅ Success States

### Campaign Sent
```tsx
import { CampaignSentSuccess } from '@/components/ui/success-state'
import { ConfettiExplosion } from '@/components/ui/confetti'

<>
  <CampaignSentSuccess
    recipientCount={1500}
    onViewAnalytics={() => router.push('/analytics')}
    onCreateAnother={() => router.push('/campaigns/new')}
  />
  <ConfettiExplosion trigger={true} />
</>
```

### First Campaign (Milestone)
```tsx
import { FirstCampaignSuccess } from '@/components/ui/success-state'
import { FireworksConfetti } from '@/components/ui/confetti'

<>
  <FirstCampaignSuccess
    onViewAnalytics={() => router.push('/analytics')}
    onLearnMore={() => window.open('/docs')}
  />
  <FireworksConfetti trigger={true} />
</>
```

---

## 🔔 Toast Notifications

### Success Toast
```tsx
import { toastSuccess } from '@/lib/utils/toast-helpers'

toastSuccess.campaignSent(1500)
```

### Error Toast
```tsx
import { toastError } from '@/lib/utils/toast-helpers'

toastError.campaignSendFailed('Network error')
```

### Promise Toast (Auto-handles loading/success/error)
```tsx
import { toastPromise } from '@/lib/utils/toast-helpers'

await toastPromise(
  sendCampaign(id),
  {
    loading: 'Sending campaign...',
    success: (data) => `Sent to ${data.count} recipients`,
    error: 'Failed to send campaign'
  }
)
```

---

## ⚡ Optimistic UI

### Simple Optimistic Update
```tsx
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update'

const { data, isPending, update } = useOptimisticUpdate(initialData, {
  onSuccess: () => toast.success('Saved'),
  onError: (err) => toast.error(err.message),
})

// Update optimistically
update(
  newData, // Show this immediately
  () => api.saveData(newData) // Sync with server
)
```

### Optimistic List (Add/Remove/Update)
```tsx
import { useOptimisticList } from '@/hooks/use-optimistic-update'
import { generateOptimisticId } from '@/lib/utils/optimistic-helpers'

const { items, addItem, removeItem, updateItem } = useOptimisticList(
  initialItems,
  {
    onSuccess: () => toast.success('Saved'),
    onError: (err) => toast.error(err.message),
  }
)

// Add
await addItem(
  { id: generateOptimisticId(), ...newItem },
  () => api.addItem(newItem)
)

// Remove
await removeItem(id, () => api.deleteItem(id))

// Update
await updateItem(id, { name: 'New Name' }, () => api.updateItem(id, updates))
```

---

## 🎉 Confetti

### Basic Confetti
```tsx
import { triggerConfetti } from '@/components/ui/confetti'

triggerConfetti('explosion') // or 'basic' | 'fireworks' | 'stars'
```

### Component-based
```tsx
import { ConfettiExplosion } from '@/components/ui/confetti'

<ConfettiExplosion trigger={showConfetti} />
```

---

## 🎯 Complete Example: Send Campaign

```tsx
'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'
import { SendProgress } from '@/components/ui/progress-states'
import { CampaignSentSuccess } from '@/components/ui/success-state'
import { ConfettiExplosion } from '@/components/ui/confetti'
import { toastPromise, toastError } from '@/lib/utils/toast-helpers'

export default function SendCampaignButton({ campaignId }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle')
  const [progress, setProgress] = useState(0)

  const handleSend = async () => {
    try {
      setStatus('sending')

      const result = await toastPromise(
        sendCampaign(campaignId, (p) => setProgress(p)),
        {
          loading: 'Sending campaign...',
          success: (data) => `Sent to ${data.recipientCount} recipients`,
          error: 'Failed to send campaign'
        }
      )

      setStatus('success')
    } catch (error) {
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <>
        <CampaignSentSuccess
          recipientCount={1500}
          onViewAnalytics={() => router.push('/analytics')}
          onCreateAnother={() => router.push('/campaigns/new')}
        />
        <ConfettiExplosion trigger={true} />
      </>
    )
  }

  if (status === 'sending') {
    return (
      <SendProgress
        progress={progress}
        total={1500}
        current={Math.floor((progress / 100) * 1500)}
        status="sending"
      />
    )
  }

  return (
    <LoadingButton onClick={handleSend}>
      Send Campaign
    </LoadingButton>
  )
}
```

---

## 🎯 Complete Example: Contact Import

```tsx
'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'
import { UploadProgress } from '@/components/ui/progress-states'
import { ContactsImportedSuccess } from '@/components/ui/success-state'
import { useOptimisticList } from '@/hooks/use-optimistic-update'
import { toastError } from '@/lib/utils/toast-helpers'

export default function ContactImport() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState({ imported: 0, skipped: 0 })

  const { items: contacts, addItem } = useOptimisticList([], {
    onError: (err) => toastError.importFailed(err.message),
  })

  const handleImport = async (file: File) => {
    setStatus('uploading')

    try {
      const data = await importCSV(file, (p) => setProgress(p))

      // Add contacts optimistically
      for (const contact of data.contacts) {
        await addItem(contact, () => Promise.resolve(contact))
      }

      setResult({ imported: data.imported, skipped: data.skipped })
      setStatus('success')
    } catch (error) {
      toastError.importFailed(error.message)
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <ContactsImportedSuccess
        importedCount={result.imported}
        skippedCount={result.skipped}
        onViewContacts={() => router.push('/contacts')}
        onImportMore={() => setStatus('idle')}
      />
    )
  }

  if (status === 'uploading') {
    return (
      <UploadProgress
        progress={progress}
        total={100}
        current={progress}
        status="uploading"
        message="Importing contacts..."
      />
    )
  }

  return (
    <LoadingButton onClick={() => document.getElementById('file-input')?.click()}>
      Import CSV
    </LoadingButton>
  )
}
```

---

## 📋 Checklist: Adding UX States to a Feature

When building a new feature, implement these states:

### Loading States
- [ ] Skeleton loader for initial load
- [ ] Loading button states
- [ ] Progress bars for uploads/processing
- [ ] Overlay spinner for updates

### Empty States
- [ ] No data state with CTA
- [ ] No search results state
- [ ] Helpful guidance text

### Success States
- [ ] Success message/page
- [ ] Next action CTAs
- [ ] Confetti for milestones

### Error Handling
- [ ] Error toasts
- [ ] Validation messages
- [ ] Rollback on optimistic update failure

### Optimistic UI
- [ ] Instant feedback on actions
- [ ] Syncing indicator
- [ ] Optimistic IDs for new items

---

## 🎨 Color Palette

```tsx
// Gradients
className="bg-gradient-to-br from-teal-500/5 to-purple-500/5"
className="bg-gradient-to-r from-teal-500 to-purple-500"

// Borders
className="border-purple-500/20"

// Text
className="text-purple-500"
className="text-teal-500"

// Success
className="text-green-600"
className="bg-green-500/5"

// Error
className="text-red-500"
className="bg-red-500/5"
```

---

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install canvas-confetti @types/canvas-confetti
npx shadcn@latest add skeleton toast progress button card input badge
```

### 2. Add Toaster to Layout
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

### 3. Import and Use
See examples above!

---

For full documentation, see [UX_STATES_GUIDE.md](UX_STATES_GUIDE.md)
