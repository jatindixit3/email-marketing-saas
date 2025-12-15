// Bulk Contact Actions API
// POST /api/contacts/bulk

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, contact_ids, data: actionData } = body;

    if (!action || !contact_ids || !Array.isArray(contact_ids)) {
      return NextResponse.json(
        { error: 'action and contact_ids are required' },
        { status: 400 }
      );
    }

    // Verify contacts belong to user
    const { data: contacts, error: verifyError } = await supabase
      .from('contacts')
      .select('id')
      .in('id', contact_ids)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (verifyError || !contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No valid contacts found' },
        { status: 400 }
      );
    }

    const validContactIds = contacts.map((c) => c.id);
    let result: any = { success: true };

    switch (action) {
      case 'delete':
        // Soft delete contacts
        const { error: deleteError } = await supabase
          .from('contacts')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', validContactIds);

        if (deleteError) throw new Error(deleteError.message);

        result.deleted = validContactIds.length;
        result.message = `${validContactIds.length} contact(s) deleted`;
        break;

      case 'update_status':
        // Update subscription status
        const { status } = actionData || {};
        if (!status) {
          return NextResponse.json(
            { error: 'status is required for update_status action' },
            { status: 400 }
          );
        }

        const { error: statusError } = await supabase
          .from('contacts')
          .update({ subscription_status: status })
          .in('id', validContactIds);

        if (statusError) throw new Error(statusError.message);

        result.updated = validContactIds.length;
        result.message = `${validContactIds.length} contact(s) updated to ${status}`;
        break;

      case 'add_to_list':
        // Add contacts to a list
        const { list_id } = actionData || {};
        if (!list_id) {
          return NextResponse.json(
            { error: 'list_id is required for add_to_list action' },
            { status: 400 }
          );
        }

        // Verify list belongs to user
        const { data: list } = await supabase
          .from('contact_lists')
          .select('id')
          .eq('id', list_id)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .single();

        if (!list) {
          return NextResponse.json(
            { error: 'List not found' },
            { status: 404 }
          );
        }

        const members = validContactIds.map((contactId) => ({
          list_id,
          contact_id: contactId,
          added_by: 'bulk_action',
        }));

        const { error: addError } = await supabase
          .from('contact_list_members')
          .upsert(members, {
            onConflict: 'contact_id,list_id',
            ignoreDuplicates: true,
          });

        if (addError) throw new Error(addError.message);

        result.added = validContactIds.length;
        result.message = `${validContactIds.length} contact(s) added to list`;
        break;

      case 'remove_from_list':
        // Remove contacts from a list
        const { list_id: removeListId } = actionData || {};
        if (!removeListId) {
          return NextResponse.json(
            { error: 'list_id is required for remove_from_list action' },
            { status: 400 }
          );
        }

        const { error: removeError } = await supabase
          .from('contact_list_members')
          .delete()
          .eq('list_id', removeListId)
          .in('contact_id', validContactIds);

        if (removeError) throw new Error(removeError.message);

        result.removed = validContactIds.length;
        result.message = `${validContactIds.length} contact(s) removed from list`;
        break;

      case 'add_tags':
        // Add tags to contacts
        const { tags: tagsToAdd } = actionData || {};
        if (!tagsToAdd || !Array.isArray(tagsToAdd)) {
          return NextResponse.json(
            { error: 'tags array is required for add_tags action' },
            { status: 400 }
          );
        }

        // Get current contacts with tags
        const { data: currentContacts } = await supabase
          .from('contacts')
          .select('id, tags')
          .in('id', validContactIds);

        // Update each contact with merged tags
        for (const contact of currentContacts || []) {
          const existingTags = contact.tags || [];
          const newTags = Array.from(new Set([...existingTags, ...tagsToAdd]));

          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', contact.id);
        }

        result.updated = validContactIds.length;
        result.message = `Tags added to ${validContactIds.length} contact(s)`;
        break;

      case 'remove_tags':
        // Remove tags from contacts
        const { tags: tagsToRemove } = actionData || {};
        if (!tagsToRemove || !Array.isArray(tagsToRemove)) {
          return NextResponse.json(
            { error: 'tags array is required for remove_tags action' },
            { status: 400 }
          );
        }

        // Get current contacts with tags
        const { data: contactsWithTags } = await supabase
          .from('contacts')
          .select('id, tags')
          .in('id', validContactIds);

        // Update each contact with filtered tags
        for (const contact of contactsWithTags || []) {
          const existingTags = contact.tags || [];
          const newTags = existingTags.filter((tag: string) => !tagsToRemove.includes(tag));

          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', contact.id);
        }

        result.updated = validContactIds.length;
        result.message = `Tags removed from ${validContactIds.length} contact(s)`;
        break;

      case 'export':
        // Export contacts to CSV
        const { data: exportContacts, error: exportError } = await supabase
          .from('contacts')
          .select('email, first_name, last_name, phone, company, subscription_status, tags, created_at')
          .in('id', validContactIds);

        if (exportError) throw new Error(exportError.message);

        // Convert to CSV
        const csv = Papa.unparse(exportContacts || []);

        result.csv = csv;
        result.count = exportContacts?.length || 0;
        result.message = `${exportContacts?.length || 0} contact(s) exported`;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in bulk action:', error);
    return NextResponse.json(
      { error: error.message || 'Bulk action failed' },
      { status: 500 }
    );
  }
}
