# Email Marketing SaaS Dashboard

A complete, production-ready dashboard layout for an email marketing SaaS application.

## 🎯 Features

### Layout Components

1. **Sidebar Navigation**
   - Dashboard, Contacts, Campaigns, Templates, Settings
   - Active state highlighting
   - Plan usage widget with upgrade CTA
   - Mobile-responsive with slide-out animation
   - Dark mode support

2. **Top Navigation Bar**
   - Mobile hamburger menu button
   - Page title and description
   - Plan badge
   - Dark mode toggle
   - Notification bell with count badge
   - User avatar dropdown

3. **Main Dashboard**
   - Stats cards (Contacts, Emails Sent, Open Rate, Click Rate)
   - Trend indicators with percentage changes
   - Recent campaigns table
   - Responsive grid layout

### Key Features

- ✅ **Dark Mode** - Full dark mode with localStorage persistence
- ✅ **Mobile Responsive** - Hamburger menu, optimized layouts
- ✅ **TypeScript** - Complete type safety
- ✅ **Modern Stack** - Next.js 14 App Router, Tailwind CSS, shadcn/ui

## 📁 File Structure

```
email-saas/
├── app/
│   └── dashboard/
│       ├── page.tsx              # Main dashboard
│       ├── contacts/page.tsx     # Contacts page
│       ├── campaigns/page.tsx    # Campaigns page
│       ├── templates/page.tsx    # Templates page
│       └── settings/page.tsx     # Settings page
├── components/
│   └── dashboard/
│       ├── dashboard-layout.tsx  # Main layout wrapper
│       ├── sidebar.tsx           # Sidebar navigation
│       └── top-nav.tsx           # Top navigation bar
└── types/
    └── dashboard.ts              # TypeScript interfaces
```

## 🚀 Usage

### Basic Dashboard Page

```tsx
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function MyPage() {
  return (
    <DashboardLayout>
      <h1>Your Content Here</h1>
    </DashboardLayout>
  );
}
```

### Navigation Routes

The dashboard includes these routes:
- `/dashboard` - Main dashboard with stats
- `/dashboard/contacts` - Contact management
- `/dashboard/campaigns` - Campaign management
- `/dashboard/templates` - Email templates
- `/dashboard/settings` - Account settings

## 🎨 Customization

### Changing Colors

The dashboard uses Tailwind's teal color palette. To change:

**Sidebar & Buttons:**
```tsx
// Change from teal-600 to your color
className="bg-teal-600 hover:bg-teal-700"
```

**Active States:**
```tsx
className="bg-teal-50 dark:bg-teal-900/20 text-teal-600"
```

### Adding Navigation Items

Edit `components/dashboard/sidebar.tsx`:

```tsx
const navigationItems = [
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
  },
  // Add more items...
];
```

### Customizing User Info

Edit `components/dashboard/top-nav.tsx`:

```tsx
<div className="text-sm font-medium">Your Name</div>
<div className="text-xs text-gray-500">your@email.com</div>
```

## 🎭 Dark Mode

Dark mode is automatically saved to `localStorage` and persists across sessions.

Users can toggle it using the moon/sun icon in the top navigation.

## 📱 Mobile Responsive

- **Desktop (≥1024px):** Sidebar always visible
- **Mobile (<1024px):** Hamburger menu, slide-out sidebar
- **Overlay:** Click outside sidebar to close on mobile

## 🔧 TypeScript Types

Complete types are available in `types/dashboard.ts`:

```typescript
import type { User, DashboardStats, Campaign, Contact } from "@/types/dashboard";
```

Available interfaces:
- `User` - User profile
- `Notification` - Notification data
- `DashboardStats` - Dashboard metrics
- `Campaign` - Email campaign
- `Contact` - Email contact
- `Template` - Email template
- `PlanLimits` - Plan limitations
- `NavigationItem` - Sidebar nav items

## 🎯 Next Steps

1. **Connect to API** - Replace mock data with real API calls
2. **Add Authentication** - Implement login/logout
3. **User Menu** - Add dropdown for avatar with profile/logout
4. **Notifications** - Implement notification panel
5. **Search** - Add global search functionality
6. **Breadcrumbs** - Add breadcrumb navigation
7. **Loading States** - Add skeleton loaders
8. **Error Handling** - Add error boundaries

## 📦 Dependencies

All required dependencies are already in `package.json`:
- Next.js 14
- React 18
- Tailwind CSS
- Lucide React (icons)
- TypeScript

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit dashboard
# http://localhost:3000/dashboard
```

## 💡 Tips

1. **Sidebar Auto-Close** - Sidebar automatically closes on mobile when navigating
2. **Dark Mode Persistence** - User preference saved in localStorage
3. **Active State** - Current page highlighted in sidebar
4. **Responsive Stats** - Stats grid adapts to screen size
5. **Plan Widget** - Shows usage and upgrade CTA in sidebar

## 🎨 Design System

**Colors:**
- Primary: Teal (600/700)
- Background: White/Gray-950
- Text: Gray-900/White
- Borders: Gray-200/Gray-800

**Spacing:**
- Page padding: p-4 lg:p-6
- Card spacing: gap-6
- Content max-width: max-w-7xl

**Typography:**
- Page titles: text-2xl font-bold
- Card titles: text-lg font-semibold
- Body text: text-sm

## 📄 License

MIT
