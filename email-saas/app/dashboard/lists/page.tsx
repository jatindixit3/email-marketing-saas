'use client';

import { useState } from 'react';
import { ListSelector } from '@/components/lists/list-selector';
import { ContactTable } from '@/components/lists/contact-table';
import { BulkActionsMenu } from '@/components/lists/bulk-actions-menu';

export default function ListsPage() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [listStats, setListStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleListSelect = async (listId: string) => {
    setSelectedListId(listId);
    setSelectedContactIds([]);

    // Fetch stats for selected list
    try {
      const response = await fetch(`/api/lists/${listId}/statistics`);
      if (response.ok) {
        const data = await response.json();
        setListStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching list stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setSelectedContactIds([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Contact Lists</h1>
          <p className="text-gray-400">
            Manage your contact lists and organize your audience
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar - List Selector */}
          <div className="lg:col-span-1">
            <ListSelector
              selectedListId={selectedListId}
              onSelect={handleListSelect}
              showCreateButton={true}
              onCreateList={() => setShowCreateDialog(true)}
            />

            {/* List Stats */}
            {selectedListId && listStats && (
              <div className="mt-6 rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  List Statistics
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-sm font-medium text-white">
                      {listStats.total_contacts?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Subscribed</span>
                    <span className="text-sm font-medium text-green-400">
                      {listStats.subscribed_contacts?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Unsubscribed</span>
                    <span className="text-sm font-medium text-red-400">
                      {listStats.unsubscribed_contacts?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Growth (7d)</span>
                    <span className="text-sm font-medium text-teal-400">
                      +{listStats.growth_7_days?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Engagement</span>
                    <span className="text-sm font-medium text-purple-400">
                      {listStats.avg_engagement_rate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Contact Table */}
          <div className="lg:col-span-3">
            {selectedListId ? (
              <div key={refreshKey}>
                <ContactTable
                  listId={selectedListId}
                  onSelectionChange={setSelectedContactIds}
                />
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 backdrop-blur-sm">
                <div className="text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-4 text-gray-400">
                    Select a list to view contacts
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Menu */}
        {selectedListId && selectedContactIds.length > 0 && (
          <BulkActionsMenu
            selectedIds={selectedContactIds}
            currentListId={selectedListId}
            onActionComplete={handleRefresh}
          />
        )}

        {/* Create List Dialog */}
        {showCreateDialog && (
          <CreateListDialog
            onClose={() => setShowCreateDialog(false)}
            onCreated={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}

// Create List Dialog Component
function CreateListDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          is_default: isDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create list');
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Create New List</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              List Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white placeholder-gray-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              placeholder="e.g., Newsletter Subscribers"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white placeholder-gray-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-2 focus:ring-teal-400"
            />
            <label htmlFor="is_default" className="text-sm text-gray-300">
              Set as default list
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create List'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-purple-500/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
