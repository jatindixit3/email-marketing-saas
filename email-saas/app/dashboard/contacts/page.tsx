import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ContactsPageClient } from '@/components/contacts/contacts-page-client';

export default async function ContactsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch contacts from database
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
  }

  const contactCount = contacts?.length || 0;

  return <ContactsPageClient initialContacts={contacts || []} contactCount={contactCount} />;
}
