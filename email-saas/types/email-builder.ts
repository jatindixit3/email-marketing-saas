// TypeScript Types for Email Builder (Unlayer)

/**
 * Unlayer design JSON structure
 */
export interface UnlayerDesign {
  counters?: Record<string, number>;
  body: {
    rows: any[];
    values: Record<string, any>;
  };
  [key: string]: any;
}

/**
 * Email design stored in database
 */
export interface EmailDesign {
  id: string;
  userId: string;
  name: string;
  description?: string | null;

  // Design data
  design: UnlayerDesign; // JSON
  html: string;

  // Metadata
  thumbnailUrl?: string | null;
  category?: string | null;
  isTemplate: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Create design input
 */
export interface CreateEmailDesignInput {
  name: string;
  description?: string;
  design: UnlayerDesign;
  html: string;
  category?: string;
  isTemplate?: boolean;
  thumbnailUrl?: string;
}

/**
 * Update design input
 */
export interface UpdateEmailDesignInput {
  name?: string;
  description?: string;
  design?: UnlayerDesign;
  html?: string;
  category?: string;
  thumbnailUrl?: string;
}

/**
 * Merge tag definition
 */
export interface MergeTag {
  name: string;
  value: string;
  sample: string;
  description?: string;
}

/**
 * Merge tag categories
 */
export type MergeTagCategory = 'contact' | 'campaign' | 'system' | 'custom';

/**
 * Grouped merge tags
 */
export interface MergeTagGroup {
  category: MergeTagCategory;
  label: string;
  tags: MergeTag[];
}

/**
 * Email builder options
 */
export interface EmailBuilderOptions {
  projectId?: number;
  locale?: string;
  appearance?: {
    theme?: 'light' | 'dark';
    panels?: {
      tools?: {
        dock?: 'left' | 'right';
      };
    };
  };
  tools?: {
    form?: {
      enabled?: boolean;
    };
  };
  mergeTags?: Record<string, {
    name: string;
    value: string;
    sample?: string;
  }>;
  displayMode?: 'email' | 'web';
  features?: {
    preview?: boolean;
    imageEditor?: boolean;
    stockImages?: boolean;
  };
}

/**
 * Design export options
 */
export interface ExportOptions {
  mergeTags?: Record<string, string>;
  cleanup?: boolean;
}

/**
 * Template category
 */
export type TemplateCategory =
  | 'newsletter'
  | 'promotion'
  | 'welcome'
  | 'announcement'
  | 'transactional'
  | 'event'
  | 'ecommerce'
  | 'other';

/**
 * Email preview mode
 */
export type PreviewMode = 'desktop' | 'mobile';
