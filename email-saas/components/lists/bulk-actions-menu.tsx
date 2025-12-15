'use client';

import { useState } from 'react';

interface BulkActionsMenuProps {
  selectedIds: string[];
  onActionComplete: () => void;
  currentListId?: string;
}

export function BulkActionsMenu({
  selectedIds,
  onActionComplete,
  currentListId,
}: BulkActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [lists, setLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [tags, setTags] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const count = selectedIds.length;

  if (count === 0) {
    return null;
  }

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          contact_ids: selectedIds,
          data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }

      setSuccess(result.message);
      setTimeout(() => {
        onActionComplete();
        setShowMenu(false);
        setShowMoveDialog(false);
        setShowTagsDialog(false);
        setShowStatusDialog(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${count} contact(s)?`)) {
      return;
    }

    await handleBulkAction('delete');
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          contact_ids: selectedIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Export failed');
      }

      // Download CSV
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Exported ${result.count} contact(s)`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openMoveDialog = async () => {
    // Fetch lists
    const response = await fetch('/api/lists');
    const data = await response.json();
    setLists(data.lists || []);
    setShowMoveDialog(true);
    setShowMenu(false);
  };

  return (
    <>
      {/* Main Action Bar */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-teal-900/90 to-purple-900/90 px-6 py-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white">
              {count} selected
            </span>

            <div className="h-6 w-px bg-white/20" />

            <div className="flex gap-2">
              <button
                onClick={openMoveDialog}
                disabled={loading}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
              >
                Add to List
              </button>

              <button
                onClick={() => {
                  setShowTagsDialog(true);
                  setShowMenu(false);
                }}
                disabled={loading}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
              >
                Manage Tags
              </button>

              <button
                onClick={() => {
                  setShowStatusDialog(true);
                  setShowMenu(false);
                }}
                disabled={loading}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
              >
                Change Status
              </button>

              <button
                onClick={handleExport}
                disabled={loading}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
              >
                Export CSV
              </button>

              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-2 text-sm text-red-400">{error}</div>
          )}
          {success && (
            <div className="mt-2 text-sm text-green-400">{success}</div>
          )}
        </div>
      </div>

      {/* Move to List Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Add to List
            </h3>

            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white"
            >
              <option value="">Select a list</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.total_contacts} contacts)
                </option>
              ))}
            </select>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (selectedListId) {
                    handleBulkAction('add_to_list', { list_id: selectedListId });
                  }
                }}
                disabled={loading || !selectedListId}
                className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to List'}
              </button>
              <button
                onClick={() => setShowMoveDialog(false)}
                className="rounded-lg border border-purple-500/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Dialog */}
      {showTagsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Manage Tags
            </h3>

            <input
              type="text"
              placeholder="Enter tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white placeholder-gray-500"
            />

            <p className="mt-2 text-xs text-gray-400">
              Example: vip, newsletter, customer
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
                  if (tagArray.length > 0) {
                    handleBulkAction('add_tags', { tags: tagArray });
                  }
                }}
                disabled={loading || !tags.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Tags'}
              </button>
              <button
                onClick={() => {
                  const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
                  if (tagArray.length > 0) {
                    handleBulkAction('remove_tags', { tags: tagArray });
                  }
                }}
                disabled={loading || !tags.trim()}
                className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50"
              >
                {loading ? 'Removing...' : 'Remove Tags'}
              </button>
              <button
                onClick={() => setShowTagsDialog(false)}
                className="rounded-lg border border-purple-500/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Change Status
            </h3>

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white"
            >
              <option value="">Select status</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
              <option value="complained">Complained</option>
            </select>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (newStatus) {
                    handleBulkAction('update_status', { status: newStatus });
                  }
                }}
                disabled={loading || !newStatus}
                className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => setShowStatusDialog(false)}
                className="rounded-lg border border-purple-500/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
