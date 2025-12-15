// API Route for Processing Contact Import
// Bulk inserts contacts to database

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import {
  mapRowToContact,
  validateContact,
  detectFileDuplicates,
  normalizeEmail,
} from '@/lib/import/validation';
import type {
  ImportConfig,
  ImportSummary,
  ContactImportResult,
  CSVRow,
  ContactValidationResult,
} from '@/types/import';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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
    const configJson = formData.get('config') as string;

    if (!file || !configJson) {
      return NextResponse.json(
        { error: 'Missing file or config' },
        { status: 400 }
      );
    }

    const config: ImportConfig = JSON.parse(configJson);

    // Validate config
    if (!config.columnMappings || config.columnMappings.length === 0) {
      return NextResponse.json(
        { error: 'Column mappings are required' },
        { status: 400 }
      );
    }

    // Check if email is mapped
    const hasEmail = config.columnMappings.some((m) => m.contactField === 'email');
    if (!hasEmail) {
      return NextResponse.json(
        { error: 'Email column must be mapped' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const content = await file.text();
    const parseResult = Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to parse CSV' },
        { status: 400 }
      );
    }

    const rows = parseResult.data;

    // Map and validate all contacts
    let validationResults: ContactValidationResult[] = rows.map((row, index) => {
      const contact = mapRowToContact(row, config.columnMappings);
      return validateContact(contact, index + 2); // +2 for header and 1-based
    });

    // Detect duplicates within file
    validationResults = detectFileDuplicates(validationResults);

    // Filter to only valid contacts
    const validContacts = validationResults.filter(
      (r) => r.isValid && !r.isDuplicate
    );

    // Check for existing contacts in database
    const emails = validContacts.map((r) => normalizeEmail(r.contact.email));

    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('email')
      .eq('user_id', user.id)
      .in('email', emails);

    const existingEmails = new Set(
      (existingContacts || []).map((c) => c.email.toLowerCase())
    );

    // Process imports
    const results: ContactImportResult[] = [];
    const contactsToInsert: any[] = [];
    const contactsToUpdate: any[] = [];

    for (const result of validationResults) {
      const { contact, rowNumber } = result;

      // Skip invalid contacts
      if (!result.isValid) {
        results.push({
          email: contact.email,
          rowNumber,
          success: false,
          action: 'skipped',
          reason: result.errors.join(', '),
        });
        continue;
      }

      // Skip file duplicates
      if (result.isDuplicate) {
        results.push({
          email: contact.email,
          rowNumber,
          success: false,
          action: 'skipped',
          reason: 'Duplicate email in file',
        });
        continue;
      }

      const email = normalizeEmail(contact.email);
      const exists = existingEmails.has(email);

      // Handle existing contacts
      if (exists) {
        if (config.skipDuplicates) {
          results.push({
            email: contact.email,
            rowNumber,
            success: true,
            action: 'skipped',
            reason: 'Email already exists',
          });
          continue;
        } else if (config.updateExisting) {
          contactsToUpdate.push({
            email,
            first_name: contact.firstName || null,
            last_name: contact.lastName || null,
            phone: contact.phone || null,
            company: contact.company || null,
            custom_fields: contact.customFields || {},
            tags: [...new Set([...(contact.tags || []), config.tagToAdd || ''].filter(Boolean))],
            updated_at: new Date().toISOString(),
          });

          results.push({
            email: contact.email,
            rowNumber,
            success: true,
            action: 'updated',
          });
          continue;
        }
      }

      // Add new contact
      contactsToInsert.push({
        user_id: user.id,
        email,
        first_name: contact.firstName || null,
        last_name: contact.lastName || null,
        phone: contact.phone || null,
        company: contact.company || null,
        status: contact.status || 'subscribed',
        subscription_source: contact.subscriptionSource || 'import',
        custom_fields: contact.customFields || {},
        tags: [...new Set([...(contact.tags || []), config.tagToAdd || ''].filter(Boolean))],
        email_verified: false,
        subscribed_at: new Date().toISOString(),
      });

      results.push({
        email: contact.email,
        rowNumber,
        success: true,
        action: 'created',
      });
    }

    // Bulk insert new contacts (in batches of 1000)
    const batchSize = 1000;
    const createdContactIds: string[] = [];

    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      const batch = contactsToInsert.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('contacts')
        .insert(batch)
        .select('id, email');

      if (error) {
        console.error('Error inserting contacts batch:', error);

        // Mark these as failed
        batch.forEach((contact) => {
          const resultIndex = results.findIndex(
            (r) => normalizeEmail(r.email) === contact.email
          );
          if (resultIndex !== -1) {
            results[resultIndex].success = false;
            results[resultIndex].reason = error.message;
          }
        });
      } else if (data) {
        createdContactIds.push(...data.map((c) => c.id));

        // Update results with contact IDs
        data.forEach((contact) => {
          const resultIndex = results.findIndex(
            (r) => normalizeEmail(r.email) === contact.email
          );
          if (resultIndex !== -1) {
            results[resultIndex].contactId = contact.id;
          }
        });
      }
    }

    // Update existing contacts (in batches)
    for (let i = 0; i < contactsToUpdate.length; i += batchSize) {
      const batch = contactsToUpdate.slice(i, i + batchSize);

      for (const contact of batch) {
        const { error } = await supabase
          .from('contacts')
          .update(contact)
          .eq('user_id', user.id)
          .eq('email', contact.email);

        if (error) {
          console.error('Error updating contact:', error);

          const resultIndex = results.findIndex(
            (r) => normalizeEmail(r.email) === contact.email
          );
          if (resultIndex !== -1) {
            results[resultIndex].success = false;
            results[resultIndex].reason = error.message;
          }
        }
      }
    }

    // Add contacts to list if specified
    if (config.listId && createdContactIds.length > 0) {
      const listContacts = createdContactIds.map((contactId) => ({
        list_id: config.listId,
        contact_id: contactId,
      }));

      // Insert in batches
      for (let i = 0; i < listContacts.length; i += batchSize) {
        const batch = listContacts.slice(i, i + batchSize);

        await supabase.from('list_contacts').insert(batch);
      }
    }

    // Calculate summary
    const created = results.filter((r) => r.action === 'created' && r.success).length;
    const updated = results.filter((r) => r.action === 'updated' && r.success).length;
    const skipped = results.filter((r) => r.action === 'skipped').length;
    const failed = results.filter((r) => !r.success && r.action !== 'skipped').length;

    const summary: ImportSummary = {
      total: rows.length,
      created,
      updated,
      skipped,
      failed,
      results,
      errors: validationResults
        .filter((r) => !r.isValid)
        .flatMap((r) =>
          r.errors.map((error) => ({
            row: r.rowNumber,
            field: 'email',
            value: r.contact.email,
            error,
          }))
        ),
      duration: Date.now() - startTime,
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error processing import:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
