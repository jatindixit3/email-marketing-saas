"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Mail,
  Send,
  Folder,
  ArrowRight,
  Plus,
  Upload,
  FileText,
} from "lucide-react";

interface DashboardPageClientProps {
  contactCount: number;
  campaignCount: number;
}

export function DashboardPageClient({ contactCount, campaignCount }: DashboardPageClientProps) {
  const router = useRouter();

  // Real stats with actual data
  const stats = [
    {
      title: "Total Contacts",
      value: contactCount.toString(),
      icon: Users,
      description: contactCount > 0 ? `${contactCount} contacts in database` : "Import your contacts to get started",
    },
    {
      title: "Campaigns",
      value: campaignCount.toString(),
      icon: Mail,
      description: campaignCount > 0 ? `${campaignCount} total campaigns` : "Create your first campaign",
    },
    {
      title: "Templates",
      value: "0",
      icon: FileText,
      description: "Build reusable email templates",
    },
    {
      title: "Lists",
      value: "0",
      icon: Folder,
      description: "Organize your contacts into lists",
    },
  ];

  const quickActions = [
    {
      title: "Import Contacts",
      description: "Upload a CSV file or add contacts manually to build your audience",
      icon: Upload,
      action: () => router.push("/dashboard/contacts/import"),
      color: "teal",
    },
    {
      title: "Create Campaign",
      description: "Design and send your first email campaign to your contacts",
      icon: Send,
      action: () => router.push("/dashboard/campaigns/create"),
      color: "blue",
    },
    {
      title: "Build Template",
      description: "Create reusable email templates for your campaigns",
      icon: FileText,
      action: () => router.push("/dashboard/campaigns/create"),
      color: "purple",
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {contactCount > 0 ? `Welcome Back! 👋` : `Welcome to Your Email Marketing Dashboard! 🎉`}
            </h2>
            <p className="text-teal-100 mb-4 max-w-2xl">
              {contactCount > 0
                ? `You have ${contactCount} contacts ready for your next campaign. Let's create something amazing!`
                : `Get started by importing your contacts and creating your first email campaign. We'll guide you through every step.`}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard/contacts/import")}
                className="bg-white text-teal-700 hover:bg-teal-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                {contactCount > 0 ? 'Add More Contacts' : 'Import Contacts'}
              </Button>
              <Button
                onClick={() => router.push("/dashboard/campaigns/create")}
                variant="outline"
                className="border-white text-white hover:bg-teal-600"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const hasData = parseInt(stat.value) > 0;
          return (
            <Card key={stat.title} className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${hasData ? 'text-teal-500' : 'text-gray-500'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-1 ${hasData ? 'text-teal-400' : 'text-white'}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-gray-400">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Quick Actions
          </CardTitle>
          <p className="text-sm text-gray-400 mt-1">
            Get started with these essential tasks to launch your email marketing
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="text-left p-6 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-all group"
                >
                  <div className={`h-12 w-12 rounded-lg bg-${action.color}-600/10 flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 text-${action.color}-500`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
                    {action.title}
                    <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Getting Started Guide
          </CardTitle>
          <p className="text-sm text-gray-400 mt-1">
            Follow these steps to set up your email marketing
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`flex items-start gap-4 p-4 rounded-lg border ${
              contactCount > 0
                ? 'bg-teal-900/20 border-teal-800'
                : 'bg-gray-800 border-gray-700'
            }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold ${
                contactCount > 0 ? 'bg-teal-600' : 'bg-teal-600'
              }`}>
                {contactCount > 0 ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">
                  {contactCount > 0 ? '✅ Contacts Imported!' : 'Import Your Contacts'}
                </h4>
                <p className="text-sm text-gray-400 mb-3">
                  {contactCount > 0
                    ? `You have ${contactCount} contacts ready to go. You can always import more!`
                    : 'Upload a CSV file with your contacts or add them manually. Make sure you have permission to email them.'}
                </p>
                <Button
                  onClick={() => router.push(contactCount > 0 ? "/dashboard/contacts" : "/dashboard/contacts/import")}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {contactCount > 0 ? 'View Contacts' : 'Import Contacts'}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-800 border border-gray-700">
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-white font-semibold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Create Your First Campaign</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Design a beautiful email using our drag-and-drop builder or choose from pre-built templates.
                </p>
                <Button
                  onClick={() => router.push("/dashboard/campaigns/create")}
                  size="sm"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-700"
                  disabled={contactCount === 0}
                >
                  {contactCount === 0 ? 'Import Contacts First' : 'Create Campaign'}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-800 border border-gray-700">
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-white font-semibold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Send or Schedule</h4>
                <p className="text-sm text-gray-400">
                  Send your campaign immediately or schedule it for the perfect time. Track opens, clicks, and engagement.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
