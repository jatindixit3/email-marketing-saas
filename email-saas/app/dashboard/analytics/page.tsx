"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  TrendingUp,
  MousePointer,
  ArrowUp,
  ArrowDown,
  Clock,
  Send,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data for subscriber growth (last 30 days)
const subscriberGrowthData = [
  { date: "Dec 1", subscribers: 2100 },
  { date: "Dec 3", subscribers: 2150 },
  { date: "Dec 5", subscribers: 2180 },
  { date: "Dec 7", subscribers: 2220 },
  { date: "Dec 9", subscribers: 2250 },
  { date: "Dec 11", subscribers: 2290 },
  { date: "Dec 13", subscribers: 2320 },
  { date: "Dec 15", subscribers: 2350 },
  { date: "Dec 17", subscribers: 2380 },
  { date: "Dec 19", subscribers: 2410 },
  { date: "Dec 21", subscribers: 2430 },
  { date: "Dec 23", subscribers: 2450 },
  { date: "Dec 25", subscribers: 2480 },
  { date: "Dec 27", subscribers: 2510 },
  { date: "Dec 29", subscribers: 2543 },
];

// Mock data for campaign performance (last 5 campaigns)
const campaignPerformanceData = [
  {
    name: "Black Friday",
    openRate: 55.8,
    clickRate: 28.3,
  },
  {
    name: "Newsletter #42",
    openRate: 38.5,
    clickRate: 15.2,
  },
  {
    name: "Summer Sale",
    openRate: 42.3,
    clickRate: 18.7,
  },
  {
    name: "Welcome Series",
    openRate: 68.2,
    clickRate: 34.5,
  },
  {
    name: "Product Launch",
    openRate: 51.4,
    clickRate: 22.6,
  },
];

// Mock data for contact sources
const contactSourcesData = [
  { name: "Website Signup", value: 1234, percentage: 50.2 },
  { name: "Import", value: 623, percentage: 25.3 },
  { name: "API", value: 389, percentage: 15.8 },
  { name: "Manual Entry", value: 214, percentage: 8.7 },
];

const COLORS = ["#2DD4BF", "#8B5CF6", "#F59E0B", "#EF4444"];

// Recent campaigns
const recentCampaigns = [
  {
    name: "Black Friday Deal",
    status: "Sent",
    sent: 3200,
    opens: 1786,
    clicks: 906,
    date: "Nov 29, 2024",
  },
  {
    name: "Weekly Newsletter #42",
    status: "Sent",
    sent: 2450,
    opens: 943,
    clicks: 372,
    date: "Dec 9, 2024",
  },
  {
    name: "Summer Sale 2024",
    status: "Sent",
    sent: 2450,
    opens: 1036,
    clicks: 458,
    date: "Dec 10, 2024",
  },
  {
    name: "Welcome Series - Day 1",
    status: "Sent",
    sent: 450,
    opens: 307,
    clicks: 155,
    date: "Dec 11, 2024",
  },
  {
    name: "Product Launch",
    status: "Scheduled",
    sent: 0,
    opens: 0,
    clicks: 0,
    date: "Dec 15, 2024",
  },
];

const stats = [
  {
    title: "Total Subscribers",
    value: "2,543",
    change: "+12.5%",
    changeType: "increase" as const,
    icon: Users,
    description: "vs last month",
  },
  {
    title: "Emails Sent",
    value: "12,840",
    change: "+8.2%",
    changeType: "increase" as const,
    icon: Mail,
    description: "this month",
  },
  {
    title: "Avg Open Rate",
    value: "42.3%",
    change: "+2.1%",
    changeType: "increase" as const,
    icon: TrendingUp,
    description: "across all campaigns",
  },
  {
    title: "Avg Click Rate",
    value: "18.7%",
    change: "+1.3%",
    changeType: "increase" as const,
    icon: MousePointer,
    description: "across all campaigns",
  },
];

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your email marketing performance
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <Icon className="h-4 w-4 text-teal-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="flex items-center text-sm">
                  {stat.changeType === "increase" ? (
                    <ArrowUp className="h-4 w-4 text-green-400 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-400 mr-1" />
                  )}
                  <span
                    className={cn(
                      "font-medium mr-2",
                      stat.changeType === "increase"
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {stat.change}
                  </span>
                  <span className="text-gray-400">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Subscriber Growth Chart */}
        <Card className="lg:col-span-2 bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Subscriber Growth</CardTitle>
            <p className="text-sm text-gray-400">Last 30 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={subscriberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                  domain={[2000, 2600]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="subscribers"
                  stroke="#2DD4BF"
                  strokeWidth={2}
                  dot={{ fill: "#2DD4BF", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contact Sources Donut Chart */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Contact Sources</CardTitle>
            <p className="text-sm text-gray-400">Where subscribers come from</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contactSourcesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {contactSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {contactSourcesData.map((source, index) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-300">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {source.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Bar Chart */}
      <Card className="mb-6 bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Campaign Performance</CardTitle>
          <p className="text-sm text-gray-400">Last 5 campaigns comparison</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: "12px" }}
                label={{ value: "Rate (%)", angle: -90, position: "insideLeft", style: { fill: "#9CA3AF" } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend
                wrapperStyle={{ color: "#fff" }}
                iconType="circle"
              />
              <Bar dataKey="openRate" name="Open Rate" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clickRate" name="Click Rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Campaigns Table */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Campaigns</CardTitle>
          <p className="text-sm text-gray-400">Your latest email campaigns</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Sent
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Opens
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Clicks
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((campaign, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-white">
                      {campaign.name}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={cn(
                          "border flex items-center gap-1 w-fit",
                          campaign.status === "Sent"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}
                      >
                        {campaign.status === "Sent" ? (
                          <Send className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-right text-white">
                      {campaign.sent > 0 ? campaign.sent.toLocaleString() : "-"}
                    </td>
                    <td className="py-4 px-4 text-sm text-right">
                      {campaign.opens > 0 ? (
                        <div>
                          <div className="text-white">{campaign.opens.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {((campaign.opens / campaign.sent) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-right">
                      {campaign.clicks > 0 ? (
                        <div>
                          <div className="text-white">{campaign.clicks.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {((campaign.clicks / campaign.sent) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-right text-gray-400">
                      {campaign.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
