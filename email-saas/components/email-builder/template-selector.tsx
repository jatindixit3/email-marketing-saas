'use client';

// Template Selector Component
// Browse and select email templates

import React, { useState, useEffect } from 'react';
import { Search, FileText, Loader2, Plus } from 'lucide-react';
import type { EmailDesign, TemplateCategory } from '@/types/email-builder';

interface TemplateSelectorProps {
  onSelect: (design: EmailDesign) => void;
  onCreateBlank: () => void;
}

const CATEGORIES: { value: TemplateCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Templates' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'event', label: 'Event' },
  { value: 'ecommerce', label: 'E-commerce' },
];

export function TemplateSelector({ onSelect, onCreateBlank }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailDesign[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter templates when search or category changes
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/email-designs?isTemplate=true');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.designs);
        setFilteredTemplates(data.designs);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Choose a Template</h2>

        {/* Search and Filter */}
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/40 focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-teal-400"
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Blank Template Card */}
            <button
              onClick={onCreateBlank}
              className="group border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-teal-400 transition-colors text-left"
            >
              <div className="aspect-[4/3] bg-white/5 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-12 h-12 text-white/40 group-hover:text-teal-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white mb-1">Start from Scratch</h3>
              <p className="text-sm text-white/60">
                Create a blank email template
              </p>
            </button>

            {/* Template Cards */}
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group border border-white/10 rounded-lg overflow-hidden hover:border-teal-400 transition-colors text-left"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-sm font-medium">
                      Use Template
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-white/60 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  {template.category && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-teal-500/20 text-teal-400">
                        {template.category}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">
              No templates found. Try a different search or category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
