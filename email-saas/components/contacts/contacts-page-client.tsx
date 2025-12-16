"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Upload, Users, FileSpreadsheet, Search, Mail, Trash2 } from "lucide-react";

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  status?: string;
}

interface ContactsPageClientProps {
  initialContacts: Contact[];
  contactCount: number;
}

export function ContactsPageClient({ initialContacts, contactCount }: ContactsPageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState(initialContacts);

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.email.toLowerCase().includes(query) ||
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query)
    );
  });

  if (contactCount === 0) {
    return (
      <DashboardLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Contacts</h1>
            <p className="text-gray-400 mt-1">
              Manage your email subscribers and audience segments
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/contacts/import')}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Empty State */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="h-16 w-16 rounded-full bg-teal-600/10 flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-teal-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">No Contacts Yet</h2>
              <p className="text-gray-400 mb-8">
                Start building your audience by importing contacts from a CSV file or adding them manually.
                Your contacts are the foundation of your email marketing campaigns.
              </p>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => router.push('/dashboard/contacts/import')}
                  className="text-left p-6 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-600 transition-all group"
                >
                  <Upload className="h-8 w-8 text-teal-500 mb-4" />
                  <h3 className="text-base font-semibold text-white mb-2">Import from CSV</h3>
                  <p className="text-sm text-gray-400">
                    Upload a CSV file with your existing contacts. Include columns for email, name, and any custom fields.
                  </p>
                </button>

                <button
                  onClick={() => router.push('/dashboard/contacts/import')}
                  className="text-left p-6 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-600 transition-all group"
                >
                  <UserPlus className="h-8 w-8 text-teal-500 mb-4" />
                  <h3 className="text-base font-semibold text-white mb-2">Add Manually</h3>
                  <p className="text-sm text-gray-400">
                    Add individual contacts one at a time with a simple form. Perfect for small lists or quick additions.
                  </p>
                </button>
              </div>

              {/* CSV Format Help */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-left">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-2">CSV Format Requirements</h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Your CSV file should include the following columns:
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• <span className="text-white font-medium">email</span> (required) - Valid email address</li>
                      <li>• <span className="text-white font-medium">first_name</span> (optional) - Contact's first name</li>
                      <li>• <span className="text-white font-medium">last_name</span> (optional) - Contact's last name</li>
                      <li>• Any additional custom fields you want to track</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-400 mt-1">
            {contactCount} {contactCount === 1 ? 'contact' : 'contacts'} in your database
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/contacts/import')}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Import Contacts
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Added</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No contacts found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-white">{contact.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {contact.first_name || contact.last_name
                          ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.status === 'subscribed'
                            ? 'bg-teal-900/30 text-teal-400'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {contact.status || 'subscribed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-teal-600/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Contacts</p>
                <p className="text-2xl font-bold text-white">{contactCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-teal-600/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Subscribed</p>
                <p className="text-2xl font-bold text-white">
                  {contacts.filter(c => c.status === 'subscribed' || !c.status).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {contacts.filter(c => {
                    const contactDate = new Date(c.created_at);
                    const now = new Date();
                    return contactDate.getMonth() === now.getMonth() &&
                           contactDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
