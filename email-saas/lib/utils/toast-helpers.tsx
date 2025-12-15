// Toast Notification Helpers

import { toast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, AlertCircle, Info, Mail, Users, Upload } from 'lucide-react'

// Success Toasts
export const toastSuccess = {
  // Campaign Success
  campaignSent: (recipientCount: number) => {
    toast({
      title: 'Campaign Sent! 🎉',
      description: `Successfully sent to ${recipientCount.toLocaleString()} recipients`,
      duration: 5000,
    })
  },

  campaignScheduled: (scheduledTime: string) => {
    toast({
      title: 'Campaign Scheduled',
      description: `Your campaign will be sent on ${scheduledTime}`,
      duration: 5000,
    })
  },

  campaignSaved: () => {
    toast({
      title: 'Campaign Saved',
      description: 'Your campaign draft has been saved successfully',
      duration: 3000,
    })
  },

  // Contact Success
  contactsImported: (count: number, skipped: number = 0) => {
    toast({
      title: 'Contacts Imported',
      description: `${count.toLocaleString()} contacts added${
        skipped > 0 ? `, ${skipped} duplicates skipped` : ''
      }`,
      duration: 5000,
    })
  },

  contactAdded: () => {
    toast({
      title: 'Contact Added',
      description: 'Contact has been added to your list',
      duration: 3000,
    })
  },

  contactsDeleted: (count: number) => {
    toast({
      title: 'Contacts Deleted',
      description: `${count.toLocaleString()} contacts removed`,
      duration: 3000,
    })
  },

  // List Success
  listCreated: (name: string) => {
    toast({
      title: 'List Created',
      description: `"${name}" has been created successfully`,
      duration: 3000,
    })
  },

  listUpdated: () => {
    toast({
      title: 'List Updated',
      description: 'Your changes have been saved',
      duration: 3000,
    })
  },

  // Template Success
  templateSaved: () => {
    toast({
      title: 'Template Saved',
      description: 'Your template is ready to use',
      duration: 3000,
    })
  },

  // Export Success
  exportReady: () => {
    toast({
      title: 'Export Ready',
      description: 'Your file has been downloaded',
      duration: 3000,
    })
  },

  // Generic Success
  success: (message: string) => {
    toast({
      title: 'Success',
      description: message,
      duration: 3000,
    })
  },
}

// Error Toasts
export const toastError = {
  // Campaign Errors
  campaignSendFailed: (error?: string) => {
    toast({
      variant: 'destructive',
      title: 'Failed to Send Campaign',
      description: error || 'An error occurred while sending your campaign',
      duration: 5000,
    })
  },

  rateLimitExceeded: (limit: number) => {
    toast({
      variant: 'destructive',
      title: 'Rate Limit Exceeded',
      description: `You've exceeded the limit of ${limit} emails per hour`,
      duration: 5000,
    })
  },

  // Contact Errors
  importFailed: (error?: string) => {
    toast({
      variant: 'destructive',
      title: 'Import Failed',
      description: error || 'Unable to import contacts. Please check your file.',
      duration: 5000,
    })
  },

  invalidEmail: () => {
    toast({
      variant: 'destructive',
      title: 'Invalid Email',
      description: 'Please enter a valid email address',
      duration: 3000,
    })
  },

  // Validation Errors
  validationFailed: (message: string) => {
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: message,
      duration: 4000,
    })
  },

  // Auth Errors
  unauthorized: () => {
    toast({
      variant: 'destructive',
      title: 'Unauthorized',
      description: 'Please sign in to continue',
      duration: 4000,
    })
  },

  // Generic Error
  error: (message: string) => {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
      duration: 4000,
    })
  },

  // Network Error
  networkError: () => {
    toast({
      variant: 'destructive',
      title: 'Network Error',
      description: 'Unable to connect. Please check your internet connection.',
      duration: 4000,
    })
  },
}

// Warning Toasts
export const toastWarning = {
  duplicateFound: (count: number) => {
    toast({
      title: 'Duplicates Found',
      description: `${count} duplicate contacts were skipped`,
      duration: 4000,
    })
  },

  unsavedChanges: () => {
    toast({
      title: 'Unsaved Changes',
      description: 'You have unsaved changes that will be lost',
      duration: 4000,
    })
  },

  warning: (message: string) => {
    toast({
      title: 'Warning',
      description: message,
      duration: 4000,
    })
  },
}

// Info Toasts
export const toastInfo = {
  processing: (message: string) => {
    toast({
      title: 'Processing...',
      description: message,
      duration: 3000,
    })
  },

  info: (message: string) => {
    toast({
      title: 'Info',
      description: message,
      duration: 3000,
    })
  },
}

// Loading Toast (returns toast ID for dismissal)
export const toastLoading = {
  start: (message: string) => {
    return toast({
      title: 'Loading...',
      description: message,
      duration: Infinity, // Won't auto-dismiss
    })
  },

  dismiss: (toastId: { id: string; dismiss: () => void; update: (props: any) => void }) => {
    toastId.dismiss()
  },

  update: (
    toastId: { id: string; dismiss: () => void; update: (props: any) => void },
    success: boolean,
    message: string
  ) => {
    toastId.update({
      title: success ? 'Success' : 'Error',
      description: message,
      variant: success ? 'default' : 'destructive',
      duration: 3000,
    })
  },
}

// Promise Toast (automatically handles loading, success, error states)
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
): Promise<T> {
  const loadingToast = toastLoading.start(messages.loading)

  try {
    const result = await promise
    const successMessage =
      typeof messages.success === 'function' ? messages.success(result) : messages.success

    loadingToast.update({
      title: 'Success',
      description: successMessage,
      duration: 3000,
    })

    return result
  } catch (error) {
    const errorMessage =
      typeof messages.error === 'function' ? messages.error(error) : messages.error

    loadingToast.update({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
      duration: 4000,
    })

    throw error
  }
}

// Usage Examples:
/*

// Basic usage
toastSuccess.campaignSent(1500)
toastError.importFailed("Invalid CSV format")

// Promise toast
await toastPromise(
  sendCampaign(campaignId),
  {
    loading: "Sending campaign...",
    success: (data) => `Campaign sent to ${data.recipientCount} recipients`,
    error: (err) => err.message || "Failed to send campaign"
  }
)

// Loading toast with manual control
const loadingToast = toastLoading.start("Uploading contacts...")
// ... do work
toastLoading.update(loadingToast, true, "Upload complete!")

*/
