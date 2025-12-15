export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "growth" | "pro" | "business" | "enterprise";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalContacts: number;
  contactsGrowth: number;
  emailsSent: number;
  emailsGrowth: number;
  openRate: number;
  openRateChange: number;
  clickRate: number;
  clickRateChange: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sent" | "paused";
  sent: number;
  opens: number;
  clicks: number;
  scheduledDate?: Date;
  createdAt: Date;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  subscribed: boolean;
  createdAt: Date;
}

export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  category: string;
  lastModified: Date;
}

export interface PlanLimits {
  contacts: number;
  emailsPerMonth: number | "unlimited";
  templates: number;
  teamMembers: number;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}
