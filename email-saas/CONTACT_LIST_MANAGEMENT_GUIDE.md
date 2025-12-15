# Contact List Management System Guide

Complete guide for the contact list CRUD system with many-to-many relationships, bulk actions, segmentation, and duplicate detection.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [UI Components](#ui-components)
6. [Features](#features)
7. [Usage Guide](#usage-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Contact List Management System provides comprehensive CRUD operations for managing contact lists with advanced features:

### ✅ Core Features

- **List Management**: Create, edit, delete contact lists
- **Many-to-Many Relationships**: Contacts can belong to multiple lists
- **Bulk Actions**: Move, delete, tag, export contacts in bulk
- **Advanced Filtering**: Search by email, name, status, tags
- **Duplicate Detection**: AI-powered duplicate contact detection
- **Merge Contacts**: Smart merging with data preservation
- **List Statistics**: Growth rates, engagement metrics
- **CSV Export**: Export filtered contacts to CSV
- **Tag Management**: Organize contacts with tags
- **Subscription Status**: Track subscribed, unsubscribed, bounced

---

## Architecture

### System Design

```
┌─────────────────────┐
│   contact_lists     │
│   - User's lists    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│contact_list_members │◄─────┤    contacts      │
│  (Many-to-Many)     │      │  - Email, name   │
└─────────────────────┘      │  - Tags, metadata│
                             └──────────────────┘
```

### Key Tables

1. **contact_lists** - User's contact lists
2. **contacts** - Individual contacts
3. **contact_list_members** - Many-to-many relationship
4. **contact_segments** - Saved filter criteria
5. **contact_duplicates** - Detected duplicate contacts
6. **list_statistics** - Daily aggregated stats

---

## Database Schema

### Setup

Run the migration:

```bash
psql -h your-db -U user -d db -f DATABASE_LIST_MANAGEMENT_SCHEMA.sql
```

Or via Supabase Dashboard → SQL Editor

### Tables

#### contact_lists

```sql
CREATE TABLE contact_lists (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_contacts INTEGER DEFAULT 0,  -- Auto-updated via trigger
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, name, deleted_at)
);
```

#### contact_list_members

```sql
CREATE TABLE contact_list_members (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by VARCHAR(50) DEFAULT 'manual',  -- 'manual', 'import', 'api'
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',

  UNIQUE(contact_id, list_id)
);
```

#### Enhanced contacts Table

```sql
ALTER TABLE contacts
ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'subscribed',
ADD COLUMN tags TEXT[],  -- Array of tags
ADD COLUMN metadata JSONB DEFAULT '{}';
```

### Automatic Features

**Triggers:**
- Auto-update `total_contacts` when members added/removed
- Auto-update `updated_at` timestamp

**Views:**
- `list_overview` - Lists with statistics
- `contact_with_lists` - Contacts with all their lists

**Functions:**
- `get_list_stats(list_id)` - Comprehensive list statistics
- `find_duplicate_contacts(user_id)` - Find duplicates

---

## API Reference

### Lists API

#### GET /api/lists

Get all lists for authenticated user.

**Query Params:**
- `include_stats` (boolean) - Include statistics from `list_overview`

**Response:**
```json
{
  "lists": [
    {
      "id": "uuid",
      "name": "Newsletter Subscribers",
      "description": "Main newsletter list",
      "total_contacts": 1250,
      "subscribed_count": 1180,
      "growth_7_days": 45,
      "is_default": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/lists

Create a new list.

**Body:**
```json
{
  "name": "VIP Customers",
  "description": "High-value customers",
  "is_default": false,
  "allow_duplicates": false
}
```

**Response:**
```json
{
  "list": {
    "id": "uuid",
    "name": "VIP Customers",
    ...
  }
}
```

#### GET /api/lists/[id]

Get single list with statistics.

**Response:**
```json
{
  "list": {
    "list_id": "uuid",
    "name": "VIP Customers",
    "total_contacts": 320,
    "subscribed_count": 310,
    "growth_7_days": 12,
    ...
  }
}
```

#### PATCH /api/lists/[id]

Update list details.

**Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "is_default": true
}
```

#### DELETE /api/lists/[id]

Soft delete a list.

**Note**: Cannot delete default list.

---

### List Contacts API

#### GET /api/lists/[id]/contacts

Get contacts in a list with filters.

**Query Params:**
- `limit` (default: 50) - Results per page
- `offset` (default: 0) - Pagination offset
- `search` - Search by email, first_name, last_name
- `status` - Filter by subscription_status
- `tags` - Comma-separated tags

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "subscription_status": "subscribed",
      "tags": ["vip", "customer"],
      "total_opens": 45,
      "total_clicks": 12,
      "added_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 320,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

#### POST /api/lists/[id]/contacts

Add contacts to a list.

**Body:**
```json
{
  "contact_ids": ["uuid1", "uuid2", "uuid3"],
  "added_by": "manual"  // or 'import', 'api'
}
```

**Response:**
```json
{
  "success": true,
  "added": 3,
  "message": "3 contact(s) added to list"
}
```

#### DELETE /api/lists/[id]/contacts

Remove contacts from a list.

**Body:**
```json
{
  "contact_ids": ["uuid1", "uuid2"]
}
```

---

### Bulk Actions API

#### POST /api/contacts/bulk

Perform bulk actions on multiple contacts.

**Actions:**

1. **Delete Contacts**
```json
{
  "action": "delete",
  "contact_ids": ["uuid1", "uuid2", ...]
}
```

2. **Update Status**
```json
{
  "action": "update_status",
  "contact_ids": ["uuid1", "uuid2"],
  "data": {
    "status": "unsubscribed"  // or 'subscribed', 'bounced', 'complained'
  }
}
```

3. **Add to List**
```json
{
  "action": "add_to_list",
  "contact_ids": ["uuid1", "uuid2"],
  "data": {
    "list_id": "list-uuid"
  }
}
```

4. **Remove from List**
```json
{
  "action": "remove_from_list",
  "contact_ids": ["uuid1", "uuid2"],
  "data": {
    "list_id": "list-uuid"
  }
}
```

5. **Add Tags**
```json
{
  "action": "add_tags",
  "contact_ids": ["uuid1", "uuid2"],
  "data": {
    "tags": ["vip", "customer"]
  }
}
```

6. **Remove Tags**
```json
{
  "action": "remove_tags",
  "contact_ids": ["uuid1", "uuid2"],
  "data": {
    "tags": ["old-tag"]
  }
}
```

7. **Export to CSV**
```json
{
  "action": "export",
  "contact_ids": ["uuid1", "uuid2", ...]
}
```

**Response:**
```json
{
  "csv": "email,first_name,last_name,...\njohn@example.com,John,Doe,...",
  "count": 150
}
```

---

### Duplicates API

#### GET /api/contacts/duplicates

Find duplicate contacts.

**Response:**
```json
{
  "duplicates": [
    {
      "primary": {
        "id": "uuid1",
        "email": "john@example.com",
        "first_name": "John"
      },
      "duplicate": {
        "id": "uuid2",
        "email": "john@example.com",
        "first_name": "Jon"
      },
      "similarity_score": 1.0,
      "matched_fields": ["email"]
    }
  ],
  "total": 5
}
```

**Similarity Scores:**
- `1.0` - Email match (exact duplicate)
- `0.9` - Phone match
- `0.8` - Name match (first + last)
- `0.5` - Partial match

#### POST /api/contacts/duplicates

Merge duplicate contacts.

**Body:**
```json
{
  "primary_id": "uuid1",
  "duplicate_id": "uuid2",
  "merge_strategy": "keep_primary"  // or 'keep_newest'
}
```

**Merge Strategies:**
- `keep_primary` - Keep primary data, fill missing fields from duplicate
- `keep_newest` - Keep data from most recently created contact

**What Gets Merged:**
- ✅ Tags (combined from both)
- ✅ Metadata & custom fields (merged)
- ✅ Open/click counts (summed)
- ✅ List memberships (transferred)
- ✅ Email events (transferred)
- ✅ Last engaged date (latest)

**Response:**
```json
{
  "success": true,
  "merged_contact_id": "uuid1",
  "deleted_contact_id": "uuid2",
  "message": "Contacts merged successfully"
}
```

---

### Statistics API

#### GET /api/lists/[id]/statistics

Get comprehensive list statistics.

**Response:**
```json
{
  "statistics": {
    "total_contacts": 1250,
    "active_contacts": 1180,
    "subscribed_contacts": 1180,
    "unsubscribed_contacts": 50,
    "bounced_contacts": 20,
    "growth_7_days": 45,
    "growth_30_days": 180,
    "avg_engagement_rate": 28.5
  },
  "timeline": [
    {
      "date": "2025-01-15",
      "total_contacts": 1200,
      "new_contacts": 10,
      "growth_rate": 0.83
    }
  ],
  "top_tags": [
    { "tag": "vip", "count": 120 },
    { "tag": "customer", "count": 450 }
  ]
}
```

---

## UI Components

### ListSelector

List picker with search and create functionality.

```typescript
import { ListSelector } from '@/components/lists/list-selector';

<ListSelector
  selectedListId={selectedListId}
  onSelect={(listId) => setSelectedListId(listId)}
  showCreateButton={true}
  onCreateList={() => setShowCreateDialog(true)}
/>
```

**Features:**
- Search lists by name
- Show contact counts
- Highlight default list
- Create new list button

### ContactTable

Advanced contact table with filters and bulk selection.

```typescript
import { ContactTable } from '@/components/lists/contact-table';

<ContactTable
  listId={listId}
  onSelectionChange={(ids) => setSelectedIds(ids)}
/>
```

**Features:**
- Search by email, name
- Filter by status, tags
- Bulk select checkboxes
- Pagination
- Status badges
- Tag display
- Engagement metrics

### BulkActionsMenu

Floating action bar for bulk operations.

```typescript
import { BulkActionsMenu } from '@/components/lists/bulk-actions-menu';

<BulkActionsMenu
  selectedIds={selectedContactIds}
  currentListId={listId}
  onActionComplete={() => refreshContacts()}
/>
```

**Actions:**
- Add to List
- Manage Tags
- Change Status
- Export CSV
- Delete

---

## Features

### 1. Many-to-Many Lists

Contacts can belong to multiple lists simultaneously:

```typescript
// Add contact to multiple lists
await fetch('/api/lists/list-1/contacts', {
  method: 'POST',
  body: JSON.stringify({ contact_ids: ['contact-123'] })
});

await fetch('/api/lists/list-2/contacts', {
  method: 'POST',
  body: JSON.stringify({ contact_ids: ['contact-123'] })
});

// Contact now in both lists!
```

### 2. Tag-Based Organization

```typescript
// Add tags to contacts
await fetch('/api/contacts/bulk', {
  method: 'POST',
  body: JSON.stringify({
    action: 'add_tags',
    contact_ids: ['id1', 'id2'],
    data: { tags: ['vip', 'customer'] }
  })
});

// Filter by tags
const response = await fetch('/api/lists/list-id/contacts?tags=vip,customer');
```

### 3. Smart Duplicate Detection

Algorithm checks:
- ✅ Exact email match (score: 1.0)
- ✅ Phone number match (score: 0.9)
- ✅ First + Last name match (score: 0.8)

```typescript
// Find duplicates
const duplicates = await fetch('/api/contacts/duplicates');

// Merge duplicates
await fetch('/api/contacts/duplicates', {
  method: 'POST',
  body: JSON.stringify({
    primary_id: 'keep-this',
    duplicate_id: 'delete-this',
    merge_strategy: 'keep_primary'
  })
});
```

### 4. CSV Export

Export filtered contacts:

```typescript
const response = await fetch('/api/contacts/bulk', {
  method: 'POST',
  body: JSON.stringify({
    action: 'export',
    contact_ids: selectedIds
  })
});

const { csv } = await response.json();

// Download automatically in UI component
const blob = new Blob([csv], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'contacts.csv';
a.click();
```

### 5. List Statistics

Track list growth and engagement:

```sql
SELECT * FROM get_list_stats('list-id');

-- Returns:
-- total_contacts, active_contacts, growth_7_days, growth_30_days, avg_engagement_rate
```

---

## Usage Guide

### Creating a List

```typescript
const response = await fetch('/api/lists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Newsletter Subscribers',
    description: 'Main newsletter list',
    is_default: true
  })
});

const { list } = await response.json();
```

### Adding Contacts to List

```typescript
// Option 1: Add specific contacts
await fetch(`/api/lists/${listId}/contacts`, {
  method: 'POST',
  body: JSON.stringify({
    contact_ids: ['uuid1', 'uuid2', 'uuid3']
  })
});

// Option 2: Import from CSV (see CONTACT_IMPORT_GUIDE.md)
// Imported contacts can be added to list during import
```

### Bulk Operations

```typescript
// Select contacts in UI
const selectedIds = ['uuid1', 'uuid2', 'uuid3'];

// Perform bulk action
await fetch('/api/contacts/bulk', {
  method: 'POST',
  body: JSON.stringify({
    action: 'add_to_list',
    contact_ids: selectedIds,
    data: { list_id: targetListId }
  })
});
```

### Finding & Merging Duplicates

```typescript
// 1. Find duplicates
const { duplicates } = await (await fetch('/api/contacts/duplicates')).json();

// 2. Review duplicates in UI
duplicates.forEach(pair => {
  console.log('Primary:', pair.primary.email);
  console.log('Duplicate:', pair.duplicate.email);
  console.log('Match:', pair.matched_fields);
  console.log('Score:', pair.similarity_score);
});

// 3. Merge selected duplicates
for (const pair of duplicates) {
  await fetch('/api/contacts/duplicates', {
    method: 'POST',
    body: JSON.stringify({
      primary_id: pair.primary.id,
      duplicate_id: pair.duplicate.id,
      merge_strategy: 'keep_primary'
    })
  });
}
```

---

## Best Practices

### 1. Use Default List

Create a default "All Contacts" list:

```sql
INSERT INTO contact_lists (user_id, name, description, is_default)
VALUES (user_id, 'All Contacts', 'Main contact list', TRUE);
```

### 2. Tag Naming Conventions

Use consistent, lowercase tags:
- ✅ `vip`, `customer`, `newsletter`
- ❌ `VIP`, `Customer`, `NewsLetter`

### 3. Regular Duplicate Checks

Run duplicate detection weekly:

```bash
# Cron job or scheduled task
0 2 * * 0 curl -X GET https://yourapp.com/api/contacts/duplicates
```

### 4. Soft Delete Lists

Never hard delete - use soft delete:

```sql
-- Soft delete preserves data
UPDATE contact_lists SET deleted_at = NOW() WHERE id = 'list-id';

-- Can restore later
UPDATE contact_lists SET deleted_at = NULL WHERE id = 'list-id';
```

### 5. Index for Performance

Ensure indexes are created:

```sql
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_email_search ON contacts USING gin(to_tsvector('english', email));
```

---

## Troubleshooting

### Issue: Duplicate memberships

**Symptom**: Contact appears multiple times in list

**Cause**: Unique constraint not enforced

**Fix:**
```sql
-- Remove duplicates
DELETE FROM contact_list_members a
USING contact_list_members b
WHERE a.id < b.id
  AND a.contact_id = b.contact_id
  AND a.list_id = b.list_id;

-- Ensure constraint exists
ALTER TABLE contact_list_members
ADD CONSTRAINT contact_list_members_unique UNIQUE(contact_id, list_id);
```

### Issue: total_contacts not updating

**Symptom**: List shows wrong contact count

**Cause**: Trigger not firing

**Fix:**
```sql
-- Manually recalculate
UPDATE contact_lists cl
SET total_contacts = (
  SELECT COUNT(*)
  FROM contact_list_members clm
  WHERE clm.list_id = cl.id
)
WHERE cl.id = 'list-id';

-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'contact_list_members_count';
```

### Issue: Slow list queries

**Symptom**: List contacts takes >2 seconds

**Solutions:**

1. **Add pagination**:
```typescript
// Always use limit/offset
const params = new URLSearchParams({
  limit: '50',
  offset: '0'
});
```

2. **Optimize filters**:
```sql
-- Use indexes
CREATE INDEX idx_members_list ON contact_list_members(list_id);
CREATE INDEX idx_contacts_status ON contacts(subscription_status);
```

3. **Cache statistics**:
```sql
-- Use materialized view
CREATE MATERIALIZED VIEW list_stats_cache AS
SELECT * FROM list_overview;

-- Refresh periodically
REFRESH MATERIALIZED VIEW list_stats_cache;
```

### Issue: Merge failed

**Symptom**: Error merging contacts

**Debugging:**
```sql
-- Check for conflicts
SELECT * FROM contacts WHERE id IN ('primary-id', 'duplicate-id');

-- Verify no campaigns are sending
SELECT * FROM campaigns WHERE list_id IN (
  SELECT list_id FROM contact_list_members WHERE contact_id = 'duplicate-id'
) AND status = 'sending';
```

---

## File Reference

### Database
- [DATABASE_LIST_MANAGEMENT_SCHEMA.sql](DATABASE_LIST_MANAGEMENT_SCHEMA.sql) - Complete schema

### API Routes
- [app/api/lists/route.ts](app/api/lists/route.ts) - List CRUD
- [app/api/lists/[id]/route.ts](app/api/lists/[id]/route.ts) - Single list
- [app/api/lists/[id]/contacts/route.ts](app/api/lists/[id]/contacts/route.ts) - List contacts
- [app/api/lists/[id]/statistics/route.ts](app/api/lists/[id]/statistics/route.ts) - Statistics
- [app/api/contacts/bulk/route.ts](app/api/contacts/bulk/route.ts) - Bulk actions
- [app/api/contacts/duplicates/route.ts](app/api/contacts/duplicates/route.ts) - Duplicates

### Components
- [components/lists/list-selector.tsx](components/lists/list-selector.tsx) - List picker
- [components/lists/contact-table.tsx](components/lists/contact-table.tsx) - Contact table
- [components/lists/bulk-actions-menu.tsx](components/lists/bulk-actions-menu.tsx) - Bulk actions

### Pages
- [app/dashboard/lists/page.tsx](app/dashboard/lists/page.tsx) - Main list management

---

**Happy List Managing! 📋**
