"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Mail,
  Clock,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignStatus = "Draft" | "Scheduled" | "Sent" | "All";

interface Campaign {
  id: number;
  name: string;
  status: Exclude<CampaignStatus, "All">;
  recipients: number;
  openRate: number;
  clickRate: number;
  date: string;
  subject: string;
}

const mockCampaigns: Campaign[] = [];

const statusConfig = {
  Draft: {
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: FileText,
  },
  Scheduled: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  Sent: {
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: Send,
  },
};

const filterOptions: CampaignStatus[] = ["All", "Draft", "Scheduled", "Sent"];

export default function CampaignsPage() {
  const [selectedFilter, setSelectedFilter] = useState<CampaignStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCampaigns = useMemo(() => {
    return mockCampaigns.filter((campaign) => {
      const matchesFilter =
        selectedFilter === "All" || campaign.status === selectedFilter;
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, searchQuery]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Campaigns
          </h1>
          <p className="text-gray-400 mt-1">
            Create and manage your email campaigns
          </p>
        </div>
        <Link href="/dashboard/campaigns/create">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setSelectedFilter(filter);
                setCurrentPage(1);
              }}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300",
                selectedFilter === filter
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/50"
                  : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-400">
          Showing {paginatedCampaigns.length} of {filteredCampaigns.length} campaign
          {filteredCampaigns.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Campaign Name
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  Status
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">
                  Recipients
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">
                  Open Rate
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">
                  Click Rate
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCampaigns.map((campaign) => {
                const StatusIcon = statusConfig[campaign.status].icon;
                return (
                  <tr
                    key={campaign.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-white">{campaign.name}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {campaign.subject}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        className={cn(
                          "border flex items-center gap-1 w-fit",
                          statusConfig[campaign.status].color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right text-white">
                      {campaign.recipients > 0
                        ? campaign.recipients.toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-4 px-6 text-right text-white">
                      {campaign.openRate > 0 ? `${campaign.openRate}%` : "-"}
                    </td>
                    <td className="py-4 px-6 text-right text-white">
                      {campaign.clickRate > 0 ? `${campaign.clickRate}%` : "-"}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400 text-sm">
                      {new Date(campaign.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {paginatedCampaigns.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-600/10 mb-6">
                <Mail className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {searchQuery || selectedFilter !== "All"
                  ? "No campaigns found"
                  : "No Campaigns Yet"}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || selectedFilter !== "All"
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "Start engaging your audience by creating your first email campaign. Design beautiful emails and track their performance."}
              </p>
              {!searchQuery && selectedFilter === "All" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-left">
                      <FileText className="h-6 w-6 text-teal-500 mb-3" />
                      <h4 className="font-semibold text-white mb-1 text-sm">Design Emails</h4>
                      <p className="text-xs text-gray-400">
                        Create beautiful emails with our editor
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-left">
                      <Send className="h-6 w-6 text-teal-500 mb-3" />
                      <h4 className="font-semibold text-white mb-1 text-sm">Send or Schedule</h4>
                      <p className="text-xs text-gray-400">
                        Send immediately or schedule for later
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-left">
                      <Mail className="h-6 w-6 text-teal-500 mb-3" />
                      <h4 className="font-semibold text-white mb-1 text-sm">Track Performance</h4>
                      <p className="text-xs text-gray-400">
                        Monitor opens, clicks, and engagement
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/campaigns/create">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
