// Merge Tags Configuration for Email Builder

import type { MergeTag, MergeTagGroup } from '@/types/email-builder';

/**
 * Available merge tags for email templates
 */
export const MERGE_TAGS: MergeTagGroup[] = [
  {
    category: 'contact',
    label: 'Contact Information',
    tags: [
      {
        name: 'Email',
        value: '{{email}}',
        sample: 'john@example.com',
        description: "Contact's email address",
      },
      {
        name: 'First Name',
        value: '{{firstName}}',
        sample: 'John',
        description: "Contact's first name",
      },
      {
        name: 'Last Name',
        value: '{{lastName}}',
        sample: 'Doe',
        description: "Contact's last name",
      },
      {
        name: 'Full Name',
        value: '{{fullName}}',
        sample: 'John Doe',
        description: "Contact's full name (first + last)",
      },
      {
        name: 'Company',
        value: '{{company}}',
        sample: 'Acme Inc',
        description: "Contact's company name",
      },
      {
        name: 'Phone',
        value: '{{phone}}',
        sample: '(555) 123-4567',
        description: "Contact's phone number",
      },
    ],
  },
  {
    category: 'campaign',
    label: 'Campaign Details',
    tags: [
      {
        name: 'Campaign Name',
        value: '{{campaignName}}',
        sample: 'Summer Newsletter',
        description: 'Name of the current campaign',
      },
      {
        name: 'Subject Line',
        value: '{{subject}}',
        sample: 'Special Offer Inside!',
        description: 'Email subject line',
      },
      {
        name: 'Preview Text',
        value: '{{previewText}}',
        sample: "Don't miss out on this exclusive offer",
        description: 'Email preview text',
      },
    ],
  },
  {
    category: 'system',
    label: 'System Links',
    tags: [
      {
        name: 'Unsubscribe Link',
        value: '{{unsubscribeLink}}',
        sample: 'https://example.com/unsubscribe',
        description: 'Link to unsubscribe from emails',
      },
      {
        name: 'View in Browser',
        value: '{{viewInBrowserLink}}',
        sample: 'https://example.com/view',
        description: 'Link to view email in browser',
      },
      {
        name: 'Update Preferences',
        value: '{{preferencesLink}}',
        sample: 'https://example.com/preferences',
        description: 'Link to update email preferences',
      },
    ],
  },
  {
    category: 'custom',
    label: 'Custom Fields',
    tags: [
      {
        name: 'Custom Field',
        value: '{{customField.fieldName}}',
        sample: 'Value from custom field',
        description: 'Access any custom field by name',
      },
    ],
  },
];

/**
 * Get all merge tags as flat array
 */
export function getAllMergeTags(): MergeTag[] {
  return MERGE_TAGS.flatMap((group) => group.tags);
}

/**
 * Get merge tags formatted for Unlayer
 * Unlayer expects: { tag: { name, value, sample } }
 */
export function getUnlayerMergeTags(): Record<string, {
  name: string;
  value: string;
  sample: string;
}> {
  const tags: Record<string, any> = {};

  MERGE_TAGS.forEach((group) => {
    group.tags.forEach((tag) => {
      // Use the value without curly braces as the key
      const key = tag.value.replace(/[{}]/g, '');

      tags[key] = {
        name: tag.name,
        value: tag.value,
        sample: tag.sample,
      };
    });
  });

  return tags;
}

/**
 * Replace merge tags in HTML with actual values
 */
export function replaceMergeTags(
  html: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    customFields?: Record<string, any>;
    campaignName?: string;
    subject?: string;
    previewText?: string;
    unsubscribeLink?: string;
    viewInBrowserLink?: string;
    preferencesLink?: string;
  }
): string {
  let result = html;

  // Contact fields
  result = result.replace(/\{\{email\}\}/g, data.email || '');
  result = result.replace(/\{\{firstName\}\}/g, data.firstName || '');
  result = result.replace(/\{\{lastName\}\}/g, data.lastName || '');
  result = result.replace(
    /\{\{fullName\}\}/g,
    [data.firstName, data.lastName].filter(Boolean).join(' ') || 'there'
  );
  result = result.replace(/\{\{company\}\}/g, data.company || '');
  result = result.replace(/\{\{phone\}\}/g, data.phone || '');

  // Campaign fields
  result = result.replace(/\{\{campaignName\}\}/g, data.campaignName || '');
  result = result.replace(/\{\{subject\}\}/g, data.subject || '');
  result = result.replace(/\{\{previewText\}\}/g, data.previewText || '');

  // System links
  result = result.replace(/\{\{unsubscribeLink\}\}/g, data.unsubscribeLink || '#');
  result = result.replace(/\{\{viewInBrowserLink\}\}/g, data.viewInBrowserLink || '#');
  result = result.replace(/\{\{preferencesLink\}\}/g, data.preferencesLink || '#');

  // Custom fields
  if (data.customFields) {
    Object.keys(data.customFields).forEach((key) => {
      const regex = new RegExp(`\\{\\{customField\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, String(data.customFields![key] || ''));
    });
  }

  return result;
}

/**
 * Get sample data for preview
 */
export function getSampleMergeData(): Record<string, string> {
  const sampleData: Record<string, string> = {};

  MERGE_TAGS.forEach((group) => {
    group.tags.forEach((tag) => {
      const key = tag.value.replace(/[{}]/g, '');
      sampleData[key] = tag.sample;
    });
  });

  return sampleData;
}

/**
 * Validate merge tags in HTML
 * Returns array of unknown tags
 */
export function validateMergeTags(html: string): string[] {
  const tagRegex = /\{\{([^}]+)\}\}/g;
  const matches = html.matchAll(tagRegex);
  const unknownTags: string[] = [];

  const knownTags = new Set(
    getAllMergeTags().map((tag) => tag.value.replace(/[{}]/g, ''))
  );

  for (const match of matches) {
    const tag = match[1];

    // Check if it's a custom field
    if (tag.startsWith('customField.')) {
      continue;
    }

    // Check if it's a known tag
    if (!knownTags.has(tag)) {
      unknownTags.push(`{{${tag}}}`);
    }
  }

  return [...new Set(unknownTags)];
}

/**
 * Get merge tag description
 */
export function getMergeTagDescription(tagValue: string): string | undefined {
  const allTags = getAllMergeTags();
  const tag = allTags.find((t) => t.value === tagValue);
  return tag?.description;
}
