# Email Builder Integration - Guide

Complete Unlayer email builder integration with merge tags, templates, and campaign creation.

## 🎯 Features

✅ **Visual Email Builder** - Drag-and-drop Unlayer editor
✅ **Merge Tags** - Dynamic content personalization
✅ **Template Gallery** - Browse and select templates
✅ **Mobile Preview** - Desktop and mobile views
✅ **Test Emails** - Send test before campaign
✅ **Save/Load Designs** - Store designs in database
✅ **HTML Export** - Clean HTML output for sending
✅ **Dark Theme** - Matches application design

---

## 📦 Components

### 1. Email Builder ([components/email-builder/email-builder.tsx](components/email-builder/email-builder.tsx))

Main visual editor component.

**Features:**
- Drag-and-drop interface
- Merge tags integration
- Desktop/mobile preview
- Export HTML
- Test email sending
- Design save/load

**Usage:**

```typescript
import { EmailBuilder } from '@/components/email-builder/email-builder';

<EmailBuilder
  initialDesign={existingDesign}
  onSave={(design, html) => {
    // Save to database
  }}
  onSend={(html) => {
    // Send test email
  }}
  saveButtonText="Save Campaign"
  showSendButton={true}
  projectId={12345} // Optional Unlayer project ID
/>
```

### 2. Template Selector ([components/email-builder/template-selector.tsx](components/email-builder/template-selector.tsx))

Browse and select email templates.

**Features:**
- Grid view of templates
- Category filter
- Search functionality
- Create blank option
- Template thumbnails

**Usage:**

```typescript
import { TemplateSelector } from '@/components/email-builder/template-selector';

<TemplateSelector
  onSelect={(template) => {
    // Load template design
  }}
  onCreateBlank={() => {
    // Start with blank
  }}
/>
```

### 3. Merge Tags ([lib/email-builder/merge-tags.ts](lib/email-builder/merge-tags.ts))

Merge tag configuration and processing.

**Available Tags:**

**Contact Information:**
- `{{email}}` - Contact email
- `{{firstName}}` - First name
- `{{lastName}}` - Last name
- `{{fullName}}` - Full name
- `{{company}}` - Company name
- `{{phone}}` - Phone number

**Campaign Details:**
- `{{campaignName}}` - Campaign name
- `{{subject}}` - Subject line
- `{{previewText}}` - Preview text

**System Links:**
- `{{unsubscribeLink}}` - Unsubscribe URL
- `{{viewInBrowserLink}}` - View in browser URL
- `{{preferencesLink}}` - Preferences URL

**Custom Fields:**
- `{{customField.fieldName}}` - Any custom field

**Usage:**

```typescript
import { replaceMergeTags } from '@/lib/email-builder/merge-tags';

const personalizedHtml = replaceMergeTags(templateHtml, {
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Acme Inc',
  customFields: {
    subscriptionType: 'Premium',
  },
  unsubscribeLink: 'https://example.com/unsubscribe?token=xxx',
});
```

---

## 🚀 Getting Started

### 1. Access Email Builder

Navigate to: `/dashboard/campaigns/builder`

Options:
- **New campaign**: `/dashboard/campaigns/builder`
- **Edit campaign**: `/dashboard/campaigns/builder?campaignId=xxx`
- **Load design**: `/dashboard/campaigns/builder?designId=xxx`

### 2. Choose Template

**Option A: Select Template**
- Browse template gallery
- Filter by category
- Search by name
- Click template to load

**Option B: Start from Scratch**
- Click "Start from Scratch"
- Begin with blank canvas

### 3. Design Email

**Editor Interface:**

**Left Panel - Tools:**
- Content blocks (text, image, button, etc.)
- Structure blocks (rows, columns)
- Saved rows and blocks

**Center Canvas:**
- Visual email preview
- Drag and drop blocks
- Click to edit content
- Real-time preview

**Right Panel - Properties:**
- Block settings
- Styling options
- Padding and spacing
- Colors and fonts

### 4. Add Merge Tags

**Method 1: Type Directly**
```html
Hello {{firstName}},

Thank you for being a {{customField.subscriptionType}} customer!
```

**Method 2: Insert from Menu**
- Select text block
- Click "Merge Tags" in toolbar
- Choose tag from dropdown

### 5. Preview Email

**Desktop Preview:**
- Click "Preview" button
- View in 600px desktop width
- See rendered merge tags

**Mobile Preview:**
- Toggle to "Mobile" view
- View in 375px mobile width
- Test responsive design

### 6. Test Email

1. Click "Send Test" button
2. Enter test email address
3. Receive actual email
4. Verify design and content
5. Check merge tag rendering

### 7. Save Design

**Save to Campaign:**
- Click "Save to Campaign"
- Design saved to campaign
- HTML generated and stored
- Ready to send

**Save as Template:**
- Mark as template in database
- Available in template gallery
- Reusable for future campaigns

---

## 📋 API Endpoints

### Get All Designs

```http
GET /api/email-designs
GET /api/email-designs?isTemplate=true
GET /api/email-designs?category=newsletter
```

**Response:**
```json
{
  "success": true,
  "designs": [
    {
      "id": "uuid",
      "name": "Welcome Email",
      "design": { ... },
      "html": "<html>...</html>",
      "category": "welcome",
      "isTemplate": true
    }
  ]
}
```

### Get Single Design

```http
GET /api/email-designs/[id]
```

**Response:**
```json
{
  "success": true,
  "design": {
    "id": "uuid",
    "name": "Welcome Email",
    "design": { ... },
    "html": "<html>...</html>"
  }
}
```

### Create Design

```http
POST /api/email-designs
Content-Type: application/json

{
  "name": "My Template",
  "description": "Custom welcome email",
  "design": { ... },
  "html": "<html>...</html>",
  "category": "welcome",
  "isTemplate": true
}
```

### Update Design

```http
PATCH /api/email-designs/[id]
Content-Type: application/json

{
  "name": "Updated Name",
  "html": "<html>...</html>"
}
```

### Delete Design

```http
DELETE /api/email-designs/[id]
```

---

## 🎨 Customization

### Unlayer Configuration

Edit in [components/email-builder/email-builder.tsx](components/email-builder/email-builder.tsx):

```typescript
options={{
  locale: 'en',
  appearance: {
    theme: 'dark', // or 'light'
    panels: {
      tools: {
        dock: 'left', // or 'right'
      },
    },
  },
  mergeTags: getUnlayerMergeTags(),
  displayMode: 'email', // or 'web'
  features: {
    preview: true,
    imageEditor: true,
    stockImages: true, // Requires Unlayer Pro
  },
  projectId: YOUR_PROJECT_ID, // Optional
}}
```

### Adding Custom Merge Tags

Edit [lib/email-builder/merge-tags.ts](lib/email-builder/merge-tags.ts):

```typescript
{
  category: 'custom',
  label: 'Custom Fields',
  tags: [
    {
      name: 'Subscription End Date',
      value: '{{customField.subscriptionEndDate}}',
      sample: '2024-12-31',
      description: 'When subscription expires',
    },
    // Add more tags...
  ],
}
```

### Custom Template Categories

Edit [types/email-builder.ts](types/email-builder.ts):

```typescript
export type TemplateCategory =
  | 'newsletter'
  | 'promotion'
  | 'welcome'
  | 'your_category'; // Add here
```

---

## 🔧 Database Schema

### Email Designs Table

You'll need to add this table to your database:

```sql
CREATE TABLE email_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Design data
  design JSONB NOT NULL,
  html TEXT NOT NULL,

  -- Metadata
  thumbnail_url TEXT,
  category VARCHAR(100),
  is_template BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_email_designs_user_id ON email_designs(user_id);
CREATE INDEX idx_email_designs_is_template ON email_designs(is_template);
CREATE INDEX idx_email_designs_category ON email_designs(category);
CREATE INDEX idx_email_designs_deleted_at ON email_designs(deleted_at) WHERE deleted_at IS NULL;
```

### Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model EmailDesign {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String    @db.VarChar(255)
  description String?   @db.Text

  // Design data
  design      Json
  html        String    @db.Text

  // Metadata
  thumbnailUrl String?  @map("thumbnail_url") @db.Text
  category    String?   @db.VarChar(100)
  isTemplate  Boolean   @default(false) @map("is_template")

  // Timestamps
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)

  @@index([userId])
  @@index([isTemplate])
  @@index([category])
  @@index([deletedAt])
  @@map("email_designs")
}
```

---

## 🎓 Best Practices

### 1. Design Guidelines

✅ **Do:**
- Use 600px max width
- Test on mobile devices
- Include alt text for images
- Use web-safe fonts
- Add unsubscribe link
- Keep file size under 100KB

❌ **Don't:**
- Use JavaScript
- Rely on CSS positioning
- Use background images for critical content
- Use video embeds
- Forget alt text

### 2. Merge Tags

✅ **Do:**
- Always provide fallbacks: `{{firstName}}` → "there"
- Test with real data
- Validate tag names
- Document custom fields

❌ **Don't:**
- Use undefined tags
- Forget to escape HTML
- Hardcode personal data

### 3. Testing

Before sending:
1. Send test to yourself
2. Check all merge tags
3. Test on desktop email clients
4. Test on mobile devices
5. Verify links work
6. Check images load

### 4. Performance

- Optimize images (use compressed PNGs/JPGs)
- Minimize inline CSS
- Use image CDN for faster loading
- Keep HTML under 100KB total

---

## 🔒 Security

### Merge Tag Safety

All merge tags are escaped to prevent XSS:

```typescript
// Automatic HTML escaping
const safe = replaceMergeTags(html, {
  firstName: '<script>alert("xss")</script>',
});
// Output: &lt;script&gt;alert("xss")&lt;/script&gt;
```

### User Data Isolation

- Designs scoped to `user_id`
- Templates can be user-specific or public
- API routes enforce authentication
- Row-level security in database

---

## 📱 Mobile Responsiveness

### Automatic Features

Unlayer automatically handles:
- Responsive columns
- Mobile-friendly buttons
- Readable font sizes
- Touch-friendly spacing

### Custom Mobile Styles

Use Unlayer's conditional CSS:

```html
<!--[if mso]>
  <style>
    /* Outlook-specific styles */
  </style>
<![endif]-->

<style>
  @media only screen and (max-width: 480px) {
    /* Mobile styles */
    .mobile-padding {
      padding: 20px !important;
    }
  }
</style>
```

---

## 🆘 Troubleshooting

### Editor Not Loading

**Issue**: Blank screen or loading forever

**Solutions:**
1. Check browser console for errors
2. Verify `react-email-editor` is installed
3. Ensure component is client-side (`'use client'`)
4. Check network tab for blocked resources

### Merge Tags Not Working

**Issue**: Tags showing as `{{firstName}}` instead of "John"

**Solutions:**
1. Verify tag syntax is correct
2. Check `replaceMergeTags()` is called
3. Ensure data object has the field
4. Test with `getSampleMergeData()`

### Design Not Saving

**Issue**: Click save but nothing happens

**Solutions:**
1. Check browser console
2. Verify API endpoint is correct
3. Check authentication token
4. Ensure database table exists

### Preview Shows Errors

**Issue**: Preview fails or shows broken layout

**Solutions:**
1. Check HTML is valid
2. Verify images have proper URLs
3. Test merge tags with sample data
4. Check browser compatibility

---

## 🚀 Advanced Usage

### Custom Blocks

Create reusable content blocks:

```typescript
// Save current selection as block
editor.saveRow((data) => {
  console.log('Saved row:', data);
});

// Load saved block
editor.loadRow(savedRowData);
```

### Programmatic Design

Generate designs from code:

```typescript
const design = {
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'text',
                values: {
                  text: 'Hello {{firstName}}!',
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

editor.loadDesign(design);
```

### Bulk Template Creation

Create multiple templates programmatically:

```typescript
const templates = [
  { name: 'Welcome', category: 'welcome', html: '...' },
  { name: 'Newsletter', category: 'newsletter', html: '...' },
];

for (const template of templates) {
  await fetch('/api/email-designs', {
    method: 'POST',
    body: JSON.stringify({
      ...template,
      isTemplate: true,
    }),
  });
}
```

---

## 📚 Resources

- **Unlayer Docs**: https://docs.unlayer.com/
- **Email Design Guide**: https://www.goodemailcode.com/
- **Can I Email**: https://www.caniemail.com/
- **Litmus Email Testing**: https://litmus.com/

---

## ✨ Summary

The email builder integration provides:

1. **Visual Editor** - Unlayer drag-and-drop interface
2. **Merge Tags** - 15+ built-in tags + custom fields
3. **Templates** - Reusable designs with categories
4. **Preview** - Desktop and mobile views
5. **Testing** - Send test emails before campaigns
6. **API** - Full CRUD for designs
7. **Database** - Persistent storage
8. **Dark Theme** - Matches application style

Perfect for creating professional email campaigns with minimal effort!
