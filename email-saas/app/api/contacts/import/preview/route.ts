// API Route for Import Preview
// Parses CSV and shows preview with validation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import {
  validateHeaders,
  suggestColumnMappings,
  validateContacts,
  getValidationSummary,
} from '@/lib/import/validation';
import type { ImportPreview, CSVRow } from '@/types/import';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Failed to parse CSV',
          details: parseResult.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    const headers = parseResult.meta.fields || [];

    // Validate headers
    const headerErrors = validateHeaders(headers);

    if (headerErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid CSV headers',
          errors: headerErrors,
        },
        { status: 400 }
      );
    }

    // Suggest column mappings
    const suggestedMappings = suggestColumnMappings(headers);

    // Validate contacts with suggested mappings
    const validationResults = validateContacts(rows, suggestedMappings);
    const summary = getValidationSummary(validationResults);

    // Get sample data (first 10 rows)
    const sampleData = rows.slice(0, 10);

    // Prepare preview
    const preview: ImportPreview = {
      totalRows: rows.length,
      validRows: summary.valid,
      invalidRows: summary.invalid,
      duplicateRows: summary.duplicates,
      headers,
      sampleData,
      suggestedMappings,
      errors: validationResults
        .filter((r) => !r.isValid)
        .flatMap((r) =>
          r.errors.map((error) => ({
            row: r.rowNumber,
            field: 'email',
            value: r.contact.email,
            error,
          }))
        )
        .slice(0, 100), // Limit to first 100 errors
    };

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error: any) {
    console.error('Error in import preview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
