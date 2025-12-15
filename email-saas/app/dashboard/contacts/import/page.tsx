import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ContactImportWizard } from '@/components/import/contact-import-wizard';

export default async function ImportContactsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <ContactImportWizard />
      </div>
    </DashboardLayout>
  );
}
