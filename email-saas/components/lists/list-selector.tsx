'use client';

import { useState, useEffect } from 'react';

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  total_contacts: number;
  is_default: boolean;
  created_at: string;
}

interface ListSelectorProps {
  selectedListId?: string | null;
  onSelect: (listId: string) => void;
  showCreateButton?: boolean;
  onCreateList?: () => void;
}

export function ListSelector({
  selectedListId,
  onSelect,
  showCreateButton = true,
  onCreateList,
}: ListSelectorProps) {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lists?include_stats=true');
      const data = await response.json();

      if (response.ok) {
        setLists(data.lists || []);

        // Auto-select default list if none selected
        if (!selectedListId && data.lists?.length > 0) {
          const defaultList = data.lists.find((l: ContactList) => l.is_default);
          if (defaultList) {
            onSelect(defaultList.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-4">
        <div className="flex animate-pulse items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-gray-600" />
          <div className="h-4 flex-1 rounded bg-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Contact Lists</h3>
        {showCreateButton && (
          <button
            onClick={onCreateList}
            className="rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-3 py-1 text-xs font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600"
          >
            + New List
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search lists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        />
      </div>

      {/* Lists */}
      <div className="space-y-1">
        {filteredLists.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            {search ? 'No lists found' : 'No lists yet'}
          </div>
        ) : (
          filteredLists.map((list) => (
            <button
              key={list.id}
              onClick={() => onSelect(list.id)}
              className={`w-full rounded-lg px-3 py-2 text-left transition-all ${
                selectedListId === list.id
                  ? 'bg-gradient-to-r from-teal-500/20 to-purple-500/20 border border-teal-400/50'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        selectedListId === list.id
                          ? 'text-teal-400'
                          : 'text-white'
                      }`}
                    >
                      {list.name}
                    </span>
                    {list.is_default && (
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                        Default
                      </span>
                    )}
                  </div>
                  {list.description && (
                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                      {list.description}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-400">
                    {list.total_contacts.toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
