# Email Marketing SaaS Landing Page

A modern, conversion-optimized landing page for an email marketing SaaS that competes with Mailchimp on price.

## Features

- **Hero Section** with clear value proposition: "Email marketing for $9/month instead of $300"
- **Social Proof** section with customer testimonials
- **Feature Comparison Table** comparing features with Mailchimp
- **Pricing Tiers** (Free, $9, $29, $49, $99) with detailed feature lists
- **FAQ Section** addressing common migration concerns
- **Footer** with trust badges and compliance information

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Beautiful icons

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
email-saas/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   └── landing-page.tsx    # Main landing page component
└── lib/
    └── utils.ts            # Utility functions
```

## Customization

Replace `[YOUR_NAME]` throughout the codebase with your actual SaaS name.

## Design Principles

- **Clean & Minimal** - Focus on content and conversion
- **Fast Loading** - Optimized components and minimal dependencies
- **Mobile-First** - Fully responsive design
- **Conversion-Optimized** - Strategic CTAs and social proof placement

## Build for Production

```bash
npm run build
npm start
```

## Deploy

Deploy easily on Vercel, Netlify, or any platform that supports Next.js.

## License

MIT
