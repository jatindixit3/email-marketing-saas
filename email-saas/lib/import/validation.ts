// Contact Import Validation Utilities

import {
  ParsedContact,
  ValidationError,
  ContactValidationResult,
  ColumnMapping,
  CSVRow,
  ContactField,
} from '@/types/import';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Check if it's all digits and reasonable length
  return /^\+?\d{7,15}$/.test(cleaned);
}

/**
 * Normalize email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize phone number
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

/**
 * Parse tags from string (comma or semicolon separated)
 */
export function parseTags(tagsString: string): string[] {
  if (!tagsString || !tagsString.trim()) {
    return [];
  }

  return tagsString
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Map CSV row to ParsedContact based on column mappings
 */
export function mapRowToContact(
  row: CSVRow,
  mappings: ColumnMapping[]
): ParsedContact {
  const contact: ParsedContact = {
    email: '',
    customFields: {},
    tags: [],
  };

  for (const mapping of mappings) {
    const value = row[mapping.csvColumn];

    if (!value || value.trim() === '') {
      continue;
    }

    switch (mapping.contactField) {
      case 'email':
        contact.email = normalizeEmail(value);
        break;

      case 'firstName':
        contact.firstName = value.trim();
        break;

      case 'lastName':
        contact.lastName = value.trim();
        break;

      case 'phone':
        contact.phone = normalizePhone(value);
        break;

      case 'company':
        contact.company = value.trim();
        break;

      case 'tags':
        contact.tags = parseTags(value);
        break;

      case 'status':
        if (['subscribed', 'unsubscribed', 'bounced', 'complained'].includes(value)) {
          contact.status = value as any;
        }
        break;

      case 'customField':
        if (mapping.customFieldName) {
          contact.customFields![mapping.customFieldName] = value.trim();
        }
        break;

      case 'ignore':
        // Skip this column
        break;
    }
  }

  return contact;
}

/**
 * Validate a single contact
 */
export function validateContact(
  contact: ParsedContact,
  rowNumber: number
): ContactValidationResult {
  const errors: string[] = [];

  // Email is required
  if (!contact.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(contact.email)) {
    errors.push(`Invalid email format: ${contact.email}`);
  }

  // Validate phone if provided
  if (contact.phone && !isValidPhone(contact.phone)) {
    errors.push(`Invalid phone number: ${contact.phone}`);
  }

  // Validate email length
  if (contact.email && contact.email.length > 255) {
    errors.push('Email too long (max 255 characters)');
  }

  // Validate name lengths
  if (contact.firstName && contact.firstName.length > 255) {
    errors.push('First name too long (max 255 characters)');
  }

  if (contact.lastName && contact.lastName.length > 255) {
    errors.push('Last name too long (max 255 characters)');
  }

  if (contact.company && contact.company.length > 255) {
    errors.push('Company name too long (max 255 characters)');
  }

  return {
    contact,
    rowNumber,
    isValid: errors.length === 0,
    errors,
    isDuplicate: false,
  };
}

/**
 * Detect duplicate emails within the CSV file
 */
export function detectFileDuplicates(
  contacts: ContactValidationResult[]
): ContactValidationResult[] {
  const emailCounts = new Map<string, number>();

  // Count occurrences of each email
  for (const result of contacts) {
    if (result.contact.email) {
      const email = result.contact.email.toLowerCase();
      emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
    }
  }

  // Mark duplicates
  return contacts.map((result) => {
    const email = result.contact.email.toLowerCase();
    const count = emailCounts.get(email) || 0;

    if (count > 1) {
      return {
        ...result,
        isDuplicate: true,
        duplicateType: 'file',
        errors: [...result.errors, 'Duplicate email in file'],
      };
    }

    return result;
  });
}

/**
 * Auto-suggest column mappings based on column names
 */
export function suggestColumnMappings(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    let suggestedField: ContactField = 'ignore';
    let customFieldName: string | undefined;

    // Email detection
    if (
      lowerHeader === 'email' ||
      lowerHeader === 'email address' ||
      lowerHeader === 'e-mail' ||
      lowerHeader === 'mail'
    ) {
      suggestedField = 'email';
    }
    // First name detection
    else if (
      lowerHeader === 'first name' ||
      lowerHeader === 'firstname' ||
      lowerHeader === 'fname' ||
      lowerHeader === 'first' ||
      lowerHeader === 'given name'
    ) {
      suggestedField = 'firstName';
    }
    // Last name detection
    else if (
      lowerHeader === 'last name' ||
      lowerHeader === 'lastname' ||
      lowerHeader === 'lname' ||
      lowerHeader === 'last' ||
      lowerHeader === 'surname' ||
      lowerHeader === 'family name'
    ) {
      suggestedField = 'lastName';
    }
    // Phone detection
    else if (
      lowerHeader === 'phone' ||
      lowerHeader === 'phone number' ||
      lowerHeader === 'mobile' ||
      lowerHeader === 'tel' ||
      lowerHeader === 'telephone'
    ) {
      suggestedField = 'phone';
    }
    // Company detection
    else if (
      lowerHeader === 'company' ||
      lowerHeader === 'company name' ||
      lowerHeader === 'organization' ||
      lowerHeader === 'org'
    ) {
      suggestedField = 'company';
    }
    // Tags detection
    else if (
      lowerHeader === 'tags' ||
      lowerHeader === 'tag' ||
      lowerHeader === 'labels' ||
      lowerHeader === 'categories'
    ) {
      suggestedField = 'tags';
    }
    // Status detection
    else if (lowerHeader === 'status' || lowerHeader === 'subscription status') {
      suggestedField = 'status';
    }
    // Everything else becomes a custom field
    else if (header.trim()) {
      suggestedField = 'customField';
      customFieldName = header.trim();
    }

    mappings.push({
      csvColumn: header,
      contactField: suggestedField,
      customFieldName,
    });
  }

  return mappings;
}

/**
 * Validate CSV headers
 */
export function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty headers
  headers.forEach((header, index) => {
    if (!header || header.trim() === '') {
      errors.push({
        row: 0,
        field: `Column ${index + 1}`,
        value: '',
        error: 'Empty column header',
      });
    }
  });

  // Check for duplicate headers
  const headerCounts = new Map<string, number>();
  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();
    headerCounts.set(normalized, (headerCounts.get(normalized) || 0) + 1);
  });

  headerCounts.forEach((count, header) => {
    if (count > 1) {
      errors.push({
        row: 0,
        field: header,
        value: header,
        error: `Duplicate column header: "${header}"`,
      });
    }
  });

  return errors;
}

/**
 * Check if email column is mapped
 */
export function hasEmailMapping(mappings: ColumnMapping[]): boolean {
  return mappings.some((m) => m.contactField === 'email');
}

/**
 * Sanitize custom field value
 */
export function sanitizeCustomFieldValue(value: any): any {
  if (typeof value === 'string') {
    // Try to parse as number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    // Try to parse as boolean
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === 'yes' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === 'no' || lower === '0') {
      return false;
    }

    // Return as string
    return value.trim();
  }

  return value;
}

/**
 * Batch validation of contacts
 */
export function validateContacts(
  rows: CSVRow[],
  mappings: ColumnMapping[]
): ContactValidationResult[] {
  // Check if email is mapped
  if (!hasEmailMapping(mappings)) {
    return [];
  }

  // Map and validate each row
  let results = rows.map((row, index) => {
    const contact = mapRowToContact(row, mappings);

    // Sanitize custom fields
    if (contact.customFields) {
      Object.keys(contact.customFields).forEach((key) => {
        contact.customFields![key] = sanitizeCustomFieldValue(
          contact.customFields![key]
        );
      });
    }

    return validateContact(contact, index + 2); // +2 for header row and 1-based indexing
  });

  // Detect duplicates within file
  results = detectFileDuplicates(results);

  return results;
}

/**
 * Get validation summary
 */
export function getValidationSummary(results: ContactValidationResult[]): {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
} {
  const total = results.length;
  const valid = results.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicates = results.filter((r) => r.isDuplicate).length;
  const invalid = total - valid - duplicates;

  return {
    total,
    valid,
    invalid,
    duplicates,
  };
}
