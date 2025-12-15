// TypeScript Types for Email Marketing SaaS Database Models

// ============================================
// ENUMS
// ============================================

export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'pro' | 'scale';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export type ContactStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';

export type SubscriptionSource = 'website' | 'import' | 'api' | 'manual';

export type TemplateCategory = 'newsletter' | 'promotion' | 'welcome' | 'announcement' | 'transactional';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export type EmailEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained';

export type BounceType = 'hard' | 'soft' | 'complaint';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

// ============================================
// USER MODEL
// ============================================

export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  fullName?: string | null;
  companyName?: string | null;

  // Subscription Information
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartedAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  trialEndsAt?: Date | null;

  // Usage Limits & Tracking
  monthlyEmailLimit: number;
  monthlyEmailsSent: number;
  contactLimit: number;

  // Metadata
  metadata: Record<string, any>;
  settings: UserSettings;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
  deletedAt?: Date | null;
}

export interface UserSettings {
  timezone?: string;
  language?: string;
  emailNotifications?: boolean;
  marketingEmails?: boolean;
  defaultFromName?: string;
  defaultFromEmail?: string;
  defaultReplyToEmail?: string;
  [key: string]: any;
}

export interface CreateUserInput {
  email: string;
  passwordHash?: string;
  fullName?: string;
  companyName?: string;
  subscriptionTier?: SubscriptionTier;
}

export interface UpdateUserInput {
  fullName?: string;
  companyName?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  settings?: Partial<UserSettings>;
  metadata?: Record<string, any>;
}

// ============================================
// LIST MODEL
// ============================================

export interface List {
  id: string;
  userId: string;
  name: string;
  description?: string | null;

  // Stats
  contactCount: number;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateListInput {
  userId: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateListInput {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// ============================================
// CONTACT MODEL
// ============================================

export interface Contact {
  id: string;
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  company?: string | null;

  // Status
  status: ContactStatus;
  subscriptionSource?: SubscriptionSource | null;

  // Engagement
  emailVerified: boolean;
  lastEngagedAt?: Date | null;

  // Custom Fields
  customFields: Record<string, any>;
  tags: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  subscribedAt?: Date | null;
  unsubscribedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface CreateContactInput {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  subscriptionSource?: SubscriptionSource;
  customFields?: Record<string, any>;
  tags?: string[];
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  status?: ContactStatus;
  customFields?: Record<string, any>;
  tags?: string[];
}

// ============================================
// LIST_CONTACT MODEL
// ============================================

export interface ListContact {
  id: string;
  listId: string;
  contactId: string;
  createdAt: Date;
}

// ============================================
// TEMPLATE MODEL
// ============================================

export interface Template {
  id: string;
  userId?: string | null;
  name: string;
  description?: string | null;

  // Template Content
  subject?: string | null;
  htmlContent: string;
  textContent?: string | null;

  // Categorization
  category?: TemplateCategory | null;
  isPublic: boolean;

  // Usage Stats
  usageCount: number;

  // Thumbnail
  thumbnailUrl?: string | null;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateTemplateInput {
  userId?: string;
  name: string;
  description?: string;
  subject?: string;
  htmlContent: string;
  textContent?: string;
  category?: TemplateCategory;
  isPublic?: boolean;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  category?: TemplateCategory;
  isPublic?: boolean;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

// ============================================
// CAMPAIGN MODEL
// ============================================

export interface Campaign {
  id: string;
  userId: string;
  templateId?: string | null;

  name: string;
  subject: string;
  previewText?: string | null;

  // Content
  htmlContent: string;
  textContent?: string | null;

  // Status & Scheduling
  status: CampaignStatus;
  scheduledAt?: Date | null;
  sentAt?: Date | null;

  // Recipients
  recipientCount: number;

  // Campaign Stats
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsUnsubscribed: number;
  emailsComplained: number;

  // Calculated Rates
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;

  // Settings
  fromName?: string | null;
  fromEmail?: string | null;
  replyToEmail?: string | null;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateCampaignInput {
  userId: string;
  templateId?: string;
  name: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  scheduledAt?: Date;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCampaignInput {
  name?: string;
  subject?: string;
  previewText?: string;
  htmlContent?: string;
  textContent?: string;
  status?: CampaignStatus;
  scheduledAt?: Date;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  metadata?: Record<string, any>;
}

export interface CampaignStats {
  campaignId: string;
  campaignName: string;
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

// ============================================
// CAMPAIGN_LIST MODEL
// ============================================

export interface CampaignList {
  id: string;
  campaignId: string;
  listId: string;
  createdAt: Date;
}

// ============================================
// EMAIL_EVENT MODEL
// ============================================

export interface EmailEvent {
  id: string;
  campaignId: string;
  contactId: string;

  // Event Information
  eventType: EmailEventType;

  // Event Details
  userAgent?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  deviceType?: DeviceType | null;

  // For clicks
  linkUrl?: string | null;
  linkText?: string | null;

  // For bounces
  bounceType?: BounceType | null;
  bounceReason?: string | null;

  // Metadata
  metadata: Record<string, any>;

  // Timestamp
  createdAt: Date;
}

export interface CreateEmailEventInput {
  campaignId: string;
  contactId: string;
  eventType: EmailEventType;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  deviceType?: DeviceType;
  linkUrl?: string;
  linkText?: string;
  bounceType?: BounceType;
  bounceReason?: string;
  metadata?: Record<string, any>;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface UserAnalytics {
  userId: string;
  totalContacts: number;
  activeContacts: number;
  totalCampaigns: number;
  emailsSentThisMonth: number;
  averageOpenRate: number;
  averageClickRate: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'campaign_sent' | 'contact_added' | 'list_created' | 'template_created';
  title: string;
  description: string;
  timestamp: Date;
}

export interface SubscriberGrowth {
  date: string;
  subscribers: number;
  change: number;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  openRate: number;
  clickRate: number;
  sentDate: Date;
}

export interface ContactSource {
  source: SubscriptionSource;
  count: number;
  percentage: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// QUERY FILTERS
// ============================================

export interface ContactFilters {
  status?: ContactStatus;
  tags?: string[];
  listId?: string;
  search?: string;
  subscriptionSource?: SubscriptionSource;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface EmailEventFilters {
  campaignId?: string;
  contactId?: string;
  eventType?: EmailEventType;
  dateFrom?: Date;
  dateTo?: Date;
}
