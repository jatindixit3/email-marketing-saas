# SendBear

Email marketing that doesn't bite.

## About

SendBear is an affordable email marketing platform for small businesses. Send professional campaigns for $9/month instead of $300.

## Features

- Simple drag-and-drop email builder
- Contact management & list segmentation
- Campaign scheduling & automation
- Real-time analytics & reporting
- Template library
- CSV import/export
- AWS SES integration for reliable email delivery
- Rate limiting & queue management with BullMQ
- GDPR compliance

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Authentication & database
- **AWS SES** - Email sending service
- **BullMQ** - Job queue for email processing
- **Upstash Redis** - Rate limiting
- **shadcn/ui** - High-quality UI components

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/jatindixit3/email-marketing-saas.git
cd email-marketing-saas
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `AWS_ACCESS_KEY_ID` - AWS access key for SES
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for SES
- `AWS_SES_FROM_EMAIL` - Verified sender email in AWS SES
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
email-saas/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── pricing/           # Pricing page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard components
│   └── landing-page-dark.tsx
├── lib/                   # Utility functions
│   ├── constants/        # Brand constants
│   ├── queue/            # Email queue worker
│   └── scheduler/        # Cron jobs
└── database/             # Database migrations
```

## Deployment

### Prerequisites

1. Set up AWS SES and verify your sending domain
2. Create a Supabase project and set up authentication
3. Set up Upstash Redis for rate limiting
4. Configure environment variables in your deployment platform

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

### Run Email Worker

For processing email queues in production:

```bash
npm run worker
```

### Run Scheduler

For scheduled campaigns:

```bash
npm run scheduler:prod
```

## License

MIT

## Support

For support, email support@sendbear.co or open an issue on GitHub.
