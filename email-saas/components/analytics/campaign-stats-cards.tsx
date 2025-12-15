'use client';

import { CampaignPerformance } from '@/lib/services/tracking-analytics';

interface CampaignStatsCardsProps {
  performance: CampaignPerformance;
}

export function CampaignStatsCards({ performance }: CampaignStatsCardsProps) {
  const stats = [
    {
      label: 'Sent',
      value: performance.totalSent.toLocaleString(),
      change: null,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
    },
    {
      label: 'Delivered',
      value: performance.totalDelivered.toLocaleString(),
      change: `${performance.deliveryRate.toFixed(1)}%`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
    },
    {
      label: 'Opened',
      value: performance.uniqueOpens.toLocaleString(),
      change: `${performance.openRate.toFixed(1)}%`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Clicked',
      value: performance.uniqueClicks.toLocaleString(),
      change: `${performance.clickRate.toFixed(1)}%`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      ),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Bounced',
      value: performance.totalBounced.toLocaleString(),
      change: `${performance.bounceRate.toFixed(1)}%`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    {
      label: 'Unsubscribed',
      value: performance.totalUnsubscribed.toLocaleString(),
      change: `${performance.unsubscribeRate.toFixed(2)}%`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-lg border ${stat.borderColor} ${stat.bgColor} p-5 backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={stat.color}>{stat.icon}</div>
              <span className="text-sm font-medium text-gray-400">
                {stat.label}
              </span>
            </div>
            {stat.change && (
              <span className={`text-xs font-semibold ${stat.color}`}>
                {stat.change}
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
