# SendBear Test Files

This folder contains mock data files for testing SendBear features.

## Contact Import Test Files

### 1. `mock-contacts-sample.csv` (25 contacts)
**Use for:** Basic import testing
- Contains valid emails with first and last names
- Perfect for testing the contact import wizard
- All emails follow proper format

### 2. `mock-contacts-large.csv` (100 contacts)
**Use for:** Performance and bulk import testing
- Mix of individual and business emails
- Tests pagination and bulk operations
- Includes customers, subscribers, leads, prospects, clients, members, and partners

### 3. `mock-contacts-invalid.csv` (13 rows with errors)
**Use for:** Testing validation and error handling
- Contains intentionally invalid emails
- Tests duplicate detection
- Tests special character handling
- Includes empty fields

## How to Use

### Import Contacts:
1. Go to Dashboard → Contacts → Import
2. Click "Upload CSV"
3. Select one of the mock CSV files
4. Map columns (email, first_name, last_name)
5. Review and import

### Test Scenarios:

**Happy Path:**
- Use `mock-contacts-sample.csv` for successful import

**Performance Testing:**
- Use `mock-contacts-large.csv` to test with 100 contacts

**Error Handling:**
- Use `mock-contacts-invalid.csv` to see validation errors
- Should show errors for invalid emails
- Should detect duplicate entries

## File Locations

All test files are in the `/public` folder:
- `/public/mock-contacts-sample.csv`
- `/public/mock-contacts-large.csv`
- `/public/mock-contacts-invalid.csv`

You can access them at:
- http://localhost:3000/mock-contacts-sample.csv
- http://localhost:3000/mock-contacts-large.csv
- http://localhost:3000/mock-contacts-invalid.csv

## Expected Results

### mock-contacts-sample.csv:
✅ All 25 contacts should import successfully
✅ No validation errors
✅ Quick import time

### mock-contacts-large.csv:
✅ All 100 valid contacts imported
✅ Tests pagination if enabled
✅ May take a few seconds

### mock-contacts-invalid.csv:
❌ Should show validation errors for:
- invalid-email-no-at.com (missing @)
- not-an-email (invalid format)
- @missing-local.com (missing local part)
- missing-domain@ (missing domain)
- spaces in@email.com (contains spaces)
✅ Should import valid emails
✅ Should flag duplicate@test.com as duplicate
