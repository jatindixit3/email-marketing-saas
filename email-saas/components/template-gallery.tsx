"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  TrendingUp,
  Users,
  Bell,
  ShoppingCart,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateCategory = "Newsletter" | "Promotion" | "Welcome" | "Announcement" | "E-commerce" | "All";

interface Template {
  id: number;
  name: string;
  category: Exclude<TemplateCategory, "All">;
  usedCount: number;
  thumbnail: string;
  description: string;
}

const mockTemplates: Template[] = [
  {
    id: 1,
    name: "Weekly Newsletter",
    category: "Newsletter",
    usedCount: 1234,
    thumbnail: "https://images.unsplash.com/photo-1557838923-2985c318be48?w=400&h=300&fit=crop",
    description: "Clean weekly newsletter design",
  },
  {
    id: 2,
    name: "Flash Sale Alert",
    category: "Promotion",
    usedCount: 892,
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop",
    description: "Eye-catching flash sale announcement",
  },
  {
    id: 3,
    name: "Welcome Series - Day 1",
    category: "Welcome",
    usedCount: 2156,
    thumbnail: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop",
    description: "First email in welcome sequence",
  },
  {
    id: 4,
    name: "Product Launch",
    category: "Announcement",
    usedCount: 567,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    description: "Announce new product releases",
  },
  {
    id: 5,
    name: "Abandoned Cart",
    category: "E-commerce",
    usedCount: 3421,
    thumbnail: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
    description: "Recover abandoned shopping carts",
  },
  {
    id: 6,
    name: "Monthly Digest",
    category: "Newsletter",
    usedCount: 987,
    thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
    description: "Monthly content roundup",
  },
  {
    id: 7,
    name: "Black Friday Deal",
    category: "Promotion",
    usedCount: 1543,
    thumbnail: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=300&fit=crop",
    description: "Special Black Friday promotion",
  },
  {
    id: 8,
    name: "Onboarding Guide",
    category: "Welcome",
    usedCount: 1876,
    thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=300&fit=crop",
    description: "Help new users get started",
  },
  {
    id: 9,
    name: "Feature Update",
    category: "Announcement",
    usedCount: 423,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    description: "Notify users about new features",
  },
  {
    id: 10,
    name: "Order Confirmation",
    category: "E-commerce",
    usedCount: 5678,
    thumbnail: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=400&h=300&fit=crop",
    description: "Professional order confirmation",
  },
  {
    id: 11,
    name: "Industry Insights",
    category: "Newsletter",
    usedCount: 654,
    thumbnail: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=300&fit=crop",
    description: "Share industry news and insights",
  },
  {
    id: 12,
    name: "Limited Time Offer",
    category: "Promotion",
    usedCount: 1298,
    thumbnail: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop",
    description: "Time-sensitive promotional email",
  },
  {
    id: 13,
    name: "Welcome Gift",
    category: "Welcome",
    usedCount: 2345,
    thumbnail: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop",
    description: "Offer a welcome discount",
  },
  {
    id: 14,
    name: "Company News",
    category: "Announcement",
    usedCount: 345,
    thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop",
    description: "Share company updates",
  },
  {
    id: 15,
    name: "Product Recommendations",
    category: "E-commerce",
    usedCount: 2987,
    thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    description: "Personalized product suggestions",
  },
  {
    id: 16,
    name: "Curated Content",
    category: "Newsletter",
    usedCount: 789,
    thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop",
    description: "Hand-picked content collection",
  },
  {
    id: 17,
    name: "Early Access",
    category: "Promotion",
    usedCount: 1123,
    thumbnail: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=400&h=300&fit=crop",
    description: "VIP early access invitation",
  },
  {
    id: 18,
    name: "Getting Started",
    category: "Welcome",
    usedCount: 1654,
    thumbnail: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop",
    description: "Quick start guide for new users",
  },
  {
    id: 19,
    name: "Event Invitation",
    category: "Announcement",
    usedCount: 678,
    thumbnail: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop",
    description: "Invite to webinar or event",
  },
  {
    id: 20,
    name: "Back in Stock",
    category: "E-commerce",
    usedCount: 2234,
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop",
    description: "Notify when products return",
  },
];

const categories: { name: TemplateCategory; icon: React.ReactNode }[] = [
  { name: "All", icon: <Filter className="h-4 w-4" /> },
  { name: "Newsletter", icon: <Mail className="h-4 w-4" /> },
  { name: "Promotion", icon: <TrendingUp className="h-4 w-4" /> },
  { name: "Welcome", icon: <Users className="h-4 w-4" /> },
  { name: "Announcement", icon: <Bell className="h-4 w-4" /> },
  { name: "E-commerce", icon: <ShoppingCart className="h-4 w-4" /> },
];

const categoryColors: Record<Exclude<TemplateCategory, "All">, string> = {
  Newsletter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Promotion: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Welcome: "bg-green-500/10 text-green-400 border-green-500/20",
  Announcement: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "E-commerce": "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

export default function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const filteredTemplates = useMemo(() => {
    return mockTemplates.filter((template) => {
      const matchesCategory =
        selectedCategory === "All" || template.category === selectedCategory;
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-teal-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <Mail className="h-8 w-8 text-teal-400" />
              <span className="ml-2 text-xl font-bold text-white">YourName</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/templates" className="text-teal-400 font-medium">
                Templates
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Email Templates
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Choose from our professionally designed templates and start sending
              beautiful emails in minutes
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
                    selectedCategory === category.name
                      ? "bg-teal-500/20 text-teal-400 border-teal-500/50 shadow-lg shadow-teal-500/20"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {category.icon}
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">
              Showing {filteredTemplates.length} template
              {filteredTemplates.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onMouseEnter={() => setHoveredCard(template.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-white/5 hover:from-teal-500/30 hover:to-purple-500/30 transition-all duration-300"
              >
                <div className="h-full rounded-2xl bg-black/40 backdrop-blur-xl overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-teal-500/10 to-purple-500/10">
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Hover Overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300",
                        hoveredCard === template.id ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold shadow-lg shadow-teal-500/50"
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
                        {template.name}
                      </h3>
                      <Badge
                        className={cn(
                          "border text-xs",
                          categoryColors[template.category]
                        )}
                      >
                        {template.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">
                      {template.description}
                    </p>

                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      Used {template.usedCount.toLocaleString()} times
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filter to find what you're looking for
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Start from scratch with our powerful drag-and-drop email builder
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold shadow-lg shadow-teal-500/50"
              >
                Create Custom Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
