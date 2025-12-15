'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  subscription_status: string;
  tags: string[];
  created_at: string;
  last_engaged_at: string | null;
  total_opens: number;
  total_clicks: number;
  added_at?: string;
}

interface ContactTableProps {
  listId: string;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ContactTable({ listId, onSelectionChange }: ContactTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 50;

  useEffect(() => {
    if (listId) {
      fetchContacts();
    }
  }, [listId, search, statusFilter, page]);

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/lists/${listId}/contacts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts || []);
        setHasMore(data.pagination?.has_more || false);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      subscribed: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        label: 'Subscribed',
      },
      unsubscribed: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        label: 'Unsubscribed',
      },
      bounced: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        label: 'Bounced',
      },
      complained: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        label: 'Complained',
      },
    };

    const { bg, text, label } = config[status] || {
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  if (loading && page === 0) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by email, name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white placeholder-gray-500 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          <option value="">All Statuses</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
          <option value="complained">Complained</option>
        </select>
      </div>

      {/* Selected count */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-teal-500/20 bg-teal-500/10 px-4 py-2">
          <span className="text-sm text-teal-400">
            {selectedIds.size} contact(s) selected
          </span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20 bg-black/20">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      contacts.length > 0 && selectedIds.size === contacts.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-2 focus:ring-teal-400"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Tags
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Opens
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Clicks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="h-12 w-12 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p className="text-gray-400">No contacts in this list</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-2 focus:ring-teal-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-white">
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : 'No Name'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {contact.email}
                        </span>
                        {contact.company && (
                          <span className="text-xs text-gray-500">
                            {contact.company}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(contact.subscription_status)}
                    </td>
                    <td className="px-4 py-3">
                      {contact.tags && contact.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{contact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">
                      {contact.total_opens || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">
                      {contact.total_clicks || 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {contact.added_at
                        ? format(new Date(contact.added_at), 'MMM d, yyyy')
                        : format(new Date(contact.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-sm text-white transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-sm text-white transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
