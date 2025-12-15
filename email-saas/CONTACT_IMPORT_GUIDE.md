# Contact Import System - User Guide

Complete CSV import system for bulk contact uploads with validation, column mapping, and duplicate detection.

## 🎯 Features

✅ **Drag & Drop Upload** - Intuitive file upload interface
✅ **CSV Parsing** - Powered by PapaParse for reliable parsing
✅ **Email Validation** - RFC-compliant email format checking
✅ **Duplicate Detection** - Detects duplicates within file and database
✅ **Column Mapping** - Intelligent auto-mapping with manual override
✅ **Preview Import** - See sample data before importing
✅ **Bulk Insert** - Efficient database inserts (1000+ contacts)
✅ **Progress Tracking** - Real-time import progress
✅ **Error Reporting** - Detailed validation errors
✅ **Custom Fields** - Map CSV columns to custom fields
✅ **Tags Support** - Import tags (comma or semicolon separated)

---

## 📁 File Requirements

### Supported Format
- **File type**: CSV (.csv)
- **Max size**: 10MB
- **Encoding**: UTF-8 recommended

### Required Column
- At least one column must map to **Email**

### Optional Columns
- First Name
- Last Name
- Phone
- Company
- Tags (comma or semicolon separated)
- Status (subscribed, unsubscribed, bounced, complained)
- Custom fields (any other columns)

---

## 🚀 Quick Start

### 1. Access Import Page

Navigate to: `/dashboard/contacts/import`

### 2. Upload CSV File

- **Drag and drop** your CSV file, OR
- **Click to browse** and select file

The system will:
- Parse the CSV
- Validate format
- Auto-suggest column mappings
- Show preview with first 10 rows

### 3. Map Columns

Review and adjust column mappings:

| CSV Column | Maps To | Description |
|------------|---------|-------------|
| email | Email | Contact email (required) |
| first_name | First Name | First name |
| last_name | Last Name | Last name |
| phone | Phone | Phone number |
| company | Company | Company name |
| tags | Tags | Comma-separated tags |
| status | Status | Subscription status |
| any_column | Custom Field | Store as custom field |
| unwanted | Ignore | Skip this column |

**Auto-Mapping:**
- System intelligently suggests mappings based on column names
- Email, first_name, last_name, etc. are automatically detected
- Unknown columns default to custom fields

### 4. Preview Import

Review stats:
- **Total rows** in CSV
- **Valid contacts** (pass validation)
- **Duplicates** (within file or database)
- **Invalid** (validation errors)

Configure options:
- **Skip duplicates**: Don't import emails that already exist
- **Update existing**: Update existing contacts with new data

### 5. Import Contacts

Click "Import Contacts" to process.

The system will:
- Validate all rows
- Filter duplicates
- Insert new contacts
- Update existing contacts (if enabled)
- Add contacts to list (if selected)
- Show final summary

---

## 📊 Example CSV

### Basic Format

```csv
email,first_name,last_name,company,phone,tags
john@example.com,John,Doe,Acme Inc,(555) 123-4567,customer;vip
jane@example.com,Jane,Smith,Tech Corp,+1-555-987-6543,prospect
bob@example.com,Bob,Johnson,Start Ltd,5551234567,customer
```

### With Custom Fields

```csv
email,first_name,company,subscription_type,lifetime_value,join_date
john@example.com,John,Acme Inc,premium,5000,2024-01-15
jane@example.com,Jane,Tech Corp,basic,500,2024-02-20
```

The system will map:
- `email` → Email
- `first_name` → First Name
- `company` → Company
- `subscription_type` → Custom Field
- `lifetime_value` → Custom Field
- `join_date` → Custom Field

---

## ✅ Validation Rules

### Email
- **Required**: Yes
- **Format**: RFC-compliant (e.g., `user@domain.com`)
- **Max length**: 255 characters
- **Normalized**: Converted to lowercase, trimmed
- **Unique**: Cannot have duplicate emails per user

### First Name / Last Name
- **Required**: No
- **Max length**: 255 characters

### Phone
- **Required**: No
- **Format**: 7-15 digits (formatting characters allowed)
- **Normalized**: Strips spaces, dashes, parentheses
- **Examples**:
  - ✅ `(555) 123-4567`
  - ✅ `+1-555-123-4567`
  - ✅ `5551234567`

### Company
- **Required**: No
- **Max length**: 255 characters

### Tags
- **Format**: Comma or semicolon separated
- **Examples**:
  - `customer,vip,premium`
  - `prospect; lead; interested`

### Status
- **Values**: `subscribed`, `unsubscribed`, `bounced`, `complained`
- **Default**: `subscribed`

### Custom Fields
- **Type**: Auto-detected (string, number, boolean)
- **Storage**: JSONB in database
- **Examples**:
  - `"5000"` → Number: 5000
  - `"true"` → Boolean: true
  - `"Premium"` → String: "Premium"

---

## 🔍 Duplicate Detection

### Within File
- Detects duplicate emails in the CSV
- **Action**: Marked as duplicate, skipped

### In Database
- Checks against existing contacts for your account
- **Actions**:
  - **Skip duplicates** (default): Don't import
  - **Update existing**: Update with new data

### Handling
- Duplicates are counted separately
- Shown in import summary
- Not counted as errors

---

## ⚠️ Common Errors

### Error: Invalid email format

**Example**: `invalid-email`, `@example.com`, `user@`

**Fix**: Ensure emails follow format `user@domain.com`

### Error: Duplicate email in file

**Example**: Same email appears multiple times in CSV

**Fix**: Remove duplicate rows before uploading

### Error: Invalid phone number

**Example**: `abc-def-ghij`, `12345` (too short)

**Fix**: Use valid phone number format (7-15 digits)

### Error: Email too long

**Example**: Email exceeds 255 characters

**Fix**: Shorten email address

### Error: Empty column header

**Example**: CSV has unnamed columns

**Fix**: Add header row with column names

### Error: Email column not mapped

**Example**: No column mapped to Email field

**Fix**: Map at least one column to Email

---

## 💾 Database Performance

### Batch Processing
- **Batch size**: 1000 contacts per batch
- **Typical speed**: ~5000 contacts/second
- **Memory**: Efficient streaming, low memory footprint

### Examples
| Contacts | Approximate Time |
|----------|-----------------|
| 100 | < 1 second |
| 1,000 | ~1 second |
| 10,000 | ~5 seconds |
| 100,000 | ~30 seconds |

*Times vary based on validation complexity and database performance*

---

## 🎨 Import Summary

After import completes, you'll see:

### Created
- New contacts added to database
- Status: subscribed (default)
- Source: import

### Updated
- Existing contacts updated with new data
- Only if "Update existing" is enabled

### Skipped
- Duplicates (if "Skip duplicates" enabled)
- Invalid rows
- File duplicates

### Failed
- Database errors
- Connection issues
- Unexpected errors

### Duration
- Total time taken for import

---

## 🛠️ Advanced Features

### Adding Tags During Import

Option 1: Include tags in CSV
```csv
email,tags
user@example.com,"customer,vip"
```

Option 2: Configure in import wizard (future feature)
- Add same tag to all imported contacts
- Useful for batch tagging

### Custom Field Mapping

Any column not mapped to standard fields becomes a custom field:

```csv
email,birthday,loyalty_points,vip_status
user@example.com,1990-05-15,5000,true
```

Results in:
```json
{
  "email": "user@example.com",
  "customFields": {
    "birthday": "1990-05-15",
    "loyalty_points": 5000,
    "vip_status": true
  }
}
```

### Updating Existing Contacts

Enable "Update existing contacts" to:
- Overwrite first name, last name, phone, company
- **Merge** custom fields (new fields added, existing preserved)
- **Merge** tags (new tags added to existing)
- Update `updated_at` timestamp

---

## 📋 Best Practices

### 1. Prepare Your CSV

✅ **Do:**
- Use clear column headers
- Include email column
- Clean data before upload
- Remove duplicate rows
- Use consistent formatting

❌ **Don't:**
- Mix different encoding types
- Use special characters in headers
- Leave columns unnamed
- Include empty rows

### 2. Test with Small File

- Start with 10-20 rows
- Verify column mappings
- Check custom field behavior
- Confirm data accuracy

### 3. Large Imports

For 10,000+ contacts:
- Split into smaller files (recommended)
- Upload during off-peak hours
- Monitor import progress
- Verify completion

### 4. Data Quality

- **Email validation**: Use real, valid emails
- **Phone formatting**: Consistent format preferred
- **Remove test data**: No `test@test.com` emails
- **Deduplication**: Remove duplicates before import

---

## 🔗 API Reference

### Preview Import

**Endpoint**: `POST /api/contacts/import/preview`

**Body**: FormData with `file`

**Response**:
```json
{
  "success": true,
  "preview": {
    "totalRows": 100,
    "validRows": 95,
    "invalidRows": 3,
    "duplicateRows": 2,
    "headers": ["email", "first_name", "last_name"],
    "sampleData": [...],
    "suggestedMappings": [...],
    "errors": [...]
  }
}
```

### Process Import

**Endpoint**: `POST /api/contacts/import/process`

**Body**:
- FormData with `file`
- FormData with `config` (JSON string)

**Config**:
```json
{
  "skipDuplicates": true,
  "updateExisting": false,
  "columnMappings": [
    {
      "csvColumn": "email",
      "contactField": "email"
    }
  ],
  "listId": "optional-list-id",
  "tagToAdd": "imported"
}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "created": 95,
    "updated": 0,
    "skipped": 3,
    "failed": 2,
    "duration": 2500,
    "results": [...],
    "errors": [...]
  }
}
```

---

## 🆘 Troubleshooting

### Import fails with "File too large"

**Solution**: File exceeds 10MB limit
- Split into multiple files
- Remove unnecessary columns
- Clean up data

### Can't map email column

**Solution**: No email column detected
- Ensure CSV has email column
- Check column header spelling
- Verify CSV format (not Excel)

### All contacts marked as duplicates

**Solution**: Contacts already exist
- Enable "Update existing" to update instead
- Or use different email addresses

### Import stuck at "Processing"

**Solution**: Large file or slow connection
- Wait longer (check browser console)
- Refresh page and try smaller file
- Check network connection

### Validation errors for all rows

**Solution**: Invalid email format
- Check email column format
- Ensure proper CSV structure
- Verify no special characters

---

## 📞 Support

For issues or questions:
- Check this guide first
- Review error messages carefully
- Verify CSV format
- Test with small sample file

---

## 🎓 Example Workflows

### Workflow 1: New Newsletter Subscribers

1. Export subscribers from previous platform
2. Save as CSV with columns: email, name
3. Upload to import wizard
4. Map columns: email → Email, name → First Name
5. Enable "Skip duplicates"
6. Import

### Workflow 2: Customer Data Migration

1. Export customers from CRM
2. Prepare CSV with: email, first_name, last_name, company, phone, purchase_date, lifetime_value
3. Upload to import wizard
4. Map standard fields + create custom fields for purchase_date and lifetime_value
5. Enable "Update existing" to refresh customer data
6. Import

### Workflow 3: Event Attendees

1. Export attendee list from event platform
2. CSV: email, name, company, event_name, ticket_type
3. Upload to import wizard
4. Map columns
5. Add tag: "event-2024" (future feature)
6. Import and add to specific event list

---

## ✨ Summary

The contact import system provides a robust, user-friendly way to bulk import contacts with:
- Validation and error handling
- Flexible column mapping
- Duplicate detection
- Efficient batch processing
- Detailed reporting

Perfect for migrating from other platforms, importing customer data, or bulk-adding newsletter subscribers.

