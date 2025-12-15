'use client'

// Example Page Demonstrating Optimistic UI Updates

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react'
import { useOptimisticList } from '@/hooks/use-optimistic-update'
import { generateOptimisticId, isOptimisticId } from '@/lib/utils/optimistic-helpers'
import { toastSuccess, toastError } from '@/lib/utils/toast-helpers'
import { LoadingButton } from '@/components/ui/loading-button'
import { ContactTableSkeleton } from '@/components/ui/loading-skeleton'
import { NoContactsEmptyState } from '@/components/ui/empty-state'
import { InlineSuccessMessage } from '@/components/ui/success-state'
import { Toaster } from '@/components/ui/toaster'

interface Contact {
  id: string | number
  email: string
  firstName: string
  lastName: string
  status: 'active' | 'unsubscribed'
  createdAt: string
}

// Simulate API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const api = {
  async addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
    await delay(1500)
    // Simulate occasional failure
    if (Math.random() > 0.8) {
      throw new Error('Failed to add contact')
    }
    return {
      ...contact,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
  },

  async deleteContact(id: string | number): Promise<void> {
    await delay(1000)
    // Simulate occasional failure
    if (Math.random() > 0.9) {
      throw new Error('Failed to delete contact')
    }
  },

  async updateContact(id: string | number, updates: Partial<Contact>): Promise<Contact> {
    await delay(1200)
    // Simulate occasional failure
    if (Math.random() > 0.85) {
      throw new Error('Failed to update contact')
    }
    return {
      id,
      email: updates.email || 'test@example.com',
      firstName: updates.firstName || 'Test',
      lastName: updates.lastName || 'User',
      status: updates.status || 'active',
      createdAt: new Date().toISOString(),
    }
  },

  async bulkDelete(ids: (string | number)[]): Promise<void> {
    await delay(1500)
    if (Math.random() > 0.85) {
      throw new Error('Failed to delete contacts')
    }
  },
}

export default function OptimisticUIExample() {
  // Initial contacts
  const initialContacts: Contact[] = [
    {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: '2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: '3',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Johnson',
      status: 'unsubscribed',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ]

  // Optimistic list hook
  const { items: contacts, isPending, addItem, removeItem, updateItem, removeItems } = useOptimisticList(
    initialContacts,
    {
      onSuccess: () => toastSuccess.success('Changes saved successfully'),
      onError: (error) => toastError.error(error.message),
      rollbackOnError: true,
    }
  )

  // Form state
  const [newContact, setNewContact] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })

  // Selected contacts for bulk actions
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])

  // Add contact with optimistic update
  const handleAddContact = async () => {
    if (!newContact.email || !newContact.firstName) {
      toastError.validationFailed('Email and first name are required')
      return
    }

    const optimisticContact: Contact = {
      id: generateOptimisticId(),
      ...newContact,
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    await addItem(optimisticContact, () => api.addContact(newContact))

    // Clear form
    setNewContact({ email: '', firstName: '', lastName: '' })
  }

  // Delete contact with optimistic update
  const handleDeleteContact = async (id: string | number) => {
    await removeItem(id, () => api.deleteContact(id))
  }

  // Update contact status with optimistic update
  const handleToggleStatus = async (contact: Contact) => {
    const newStatus = contact.status === 'active' ? 'unsubscribed' : 'active'
    await updateItem(contact.id, { status: newStatus }, () =>
      api.updateContact(contact.id, { status: newStatus })
    )
  }

  // Toggle selection
  const toggleSelection = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    )
  }

  // Bulk delete with optimistic update
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    await removeItems(selectedIds, () => api.bulkDelete(selectedIds))
    setSelectedIds([])
  }

  // Show empty state if no contacts
  if (contacts.length === 0 && !isPending) {
    return (
      <div className="p-8">
        <NoContactsEmptyState
          onImport={() => alert('Import clicked')}
          onAddManually={() => alert('Add manually clicked')}
        />
        <Toaster />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">Optimistic UI Demo</h1>
        <p className="text-muted-foreground">
          Watch contacts update instantly, then sync with the server. Automatic rollback on errors.
        </p>
      </div>

      {/* Add Contact Form */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Add New Contact (Optimistic Update)</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
          />
          <Input
            placeholder="First Name"
            value={newContact.firstName}
            onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
          />
          <Input
            placeholder="Last Name"
            value={newContact.lastName}
            onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
          />
          <LoadingButton
            onClick={handleAddContact}
            loading={isPending}
            className="bg-gradient-to-r from-teal-500 to-purple-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </LoadingButton>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Try adding a contact - it appears instantly! Simulated API delay: 1.5s. Random 20% failure
          rate for testing rollback.
        </p>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-purple-500/30 bg-purple-500/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''} selected
            </p>
            <LoadingButton
              onClick={handleBulkDelete}
              loading={isPending}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </LoadingButton>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-teal-500/30 bg-teal-500/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-teal-700">How Optimistic UI Works:</h3>
        <ul className="space-y-1 text-xs text-teal-600">
          <li>✓ Updates appear instantly in the UI (optimistic)</li>
          <li>✓ API call happens in the background</li>
          <li>✓ If successful, optimistic ID is replaced with real server ID</li>
          <li>✓ If failed, changes are rolled back automatically</li>
          <li>✓ Pending operations show a subtle loading indicator</li>
        </ul>
      </Card>

      {/* Contacts Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contacts ({contacts.length})</h2>
          {isPending && (
            <Badge variant="outline" className="border-purple-500/50 text-purple-500">
              Syncing...
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {contacts.map((contact) => {
            const isOptimistic = isOptimisticId(contact.id)
            const isSelected = selectedIds.includes(contact.id)

            return (
              <div
                key={contact.id}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                  isOptimistic
                    ? 'border-purple-500/50 bg-purple-500/5'
                    : 'border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5'
                } ${isSelected ? 'ring-2 ring-purple-500/50' : ''}`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(contact.id)}
                  className="h-4 w-4 cursor-pointer"
                />

                {/* Contact Info */}
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {contact.firstName} {contact.lastName}
                    {isOptimistic && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Saving...
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>

                {/* Status */}
                <Button
                  onClick={() => handleToggleStatus(contact)}
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                >
                  <Badge
                    variant={contact.status === 'active' ? 'default' : 'secondary'}
                    className="cursor-pointer"
                  >
                    {contact.status === 'active' ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    {contact.status}
                  </Badge>
                </Button>

                {/* Created Date */}
                <p className="text-xs text-muted-foreground">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <Button
                  onClick={() => handleDeleteContact(contact.id)}
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Toast Container */}
      <Toaster />
    </div>
  )
}
