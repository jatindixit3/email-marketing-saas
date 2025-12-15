"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Palette, Zap, Layout } from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();

  const templateFeatures = [
    {
      icon: Palette,
      title: "Custom Design",
      description: "Create beautiful emails with our drag-and-drop builder or HTML editor",
    },
    {
      icon: Layout,
      title: "Responsive Layout",
      description: "Your templates will look great on all devices and email clients",
    },
    {
      icon: Zap,
      title: "Reusable",
      description: "Save time by reusing templates across multiple campaigns",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Templates
          </h1>
          <p className="text-gray-400 mt-1">
            Browse and customize email templates
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/campaigns/create')}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Empty State */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-full bg-purple-600/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">
              No Templates Yet
            </h2>
            <p className="text-gray-400 mb-8">
              Create reusable email templates to streamline your campaign creation process.
              Templates help you maintain consistent branding and save time.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {templateFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="p-6 rounded-lg bg-gray-800 border border-gray-700"
                  >
                    <Icon className="h-8 w-8 text-purple-500 mb-4 mx-auto" />
                    <h3 className="text-base font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Ready to Create Your First Template?</h3>
              <p className="text-sm text-gray-400 mb-4">
                Start with a blank canvas or use our campaign builder to design professional email templates
                that match your brand.
              </p>
              <Button
                onClick={() => router.push('/dashboard/campaigns/create')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
