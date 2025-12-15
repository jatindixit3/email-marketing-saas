// TypeScript Types for Contact Import System

import { ContactStatus, SubscriptionSource } from './database';

/**
 * CSV Row (raw data from file)
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * Parsed contact from CSV
 */
export interface ParsedContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  status?: ContactStatus;
  subscriptionSource?: SubscriptionSource;
}

/**
 * Contact field mapping
 */
export type ContactField =
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'company'
  | 'tags'
  | 'status'
  | 'customField'
  | 'ignore';

/**
 * Column mapping (CSV column → Contact field)
 */
export interface ColumnMapping {
  csvColumn: string;
  contactField: ContactField;
  customFieldName?: string; // If contactField is 'customField'
}

/**
 * Validation error for a single row
 */
export interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Contact validation result
 */
export interface ContactValidationResult {
  contact: ParsedContact;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateType?: 'file' | 'database';
}

/**
 * Import preview data
 */
export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  headers: string[];
  sampleData: CSVRow[];
  suggestedMappings: ColumnMapping[];
  errors: ValidationError[];
}

/**
 * Import configuration
 */
export interface ImportConfig {
  listId?: string; // Add imported contacts to this list
  skipDuplicates: boolean;
  updateExisting: boolean;
  columnMappings: ColumnMapping[];
  tagToAdd?: string; // Add a tag to all imported contacts
}

/**
 * Import result for a single contact
 */
export interface ContactImportResult {
  email: string;
  rowNumber: number;
  success: boolean;
  action: 'created' | 'updated' | 'skipped';
  reason?: string;
  contactId?: string;
}

/**
 * Final import summary
 */
export interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: ContactImportResult[];
  errors: ValidationError[];
  duration: number; // milliseconds
}

/**
 * Import step (for wizard UI)
 */
export type ImportStep = 'upload' | 'mapping' | 'preview' | 'import' | 'complete';

/**
 * Import state (for frontend)
 */
export interface ImportState {
  step: ImportStep;
  file: File | null;
  preview: ImportPreview | null;
  config: ImportConfig;
  summary: ImportSummary | null;
  isProcessing: boolean;
  progress: number; // 0-100
  error: string | null;
}

/**
 * Field suggestion (for auto-mapping)
 */
export interface FieldSuggestion {
  csvColumn: string;
  suggestedField: ContactField;
  confidence: number; // 0-1
}
