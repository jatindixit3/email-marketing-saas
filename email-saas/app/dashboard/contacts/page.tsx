"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload, Users, FileSpreadsheet } from "lucide-react";

export default function ContactsPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Contacts
          </h1>
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
            <h2 className="text-xl font-semibold text-white mb-3">
              No Contacts Yet
            </h2>
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
                <h3 className="text-base font-semibold text-white mb-2">
                  Import from CSV
                </h3>
                <p className="text-sm text-gray-400">
                  Upload a CSV file with your existing contacts. Include columns for email, name, and any custom fields.
                </p>
              </button>

              <button
                onClick={() => router.push('/dashboard/contacts/import')}
                className="text-left p-6 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-600 transition-all group"
              >
                <UserPlus className="h-8 w-8 text-teal-500 mb-4" />
                <h3 className="text-base font-semibold text-white mb-2">
                  Add Manually
                </h3>
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
