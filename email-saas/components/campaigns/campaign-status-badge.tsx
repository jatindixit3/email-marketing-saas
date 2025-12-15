'use client';

import { getRelativeTime } from '@/lib/scheduler/timezone';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  showTime?: boolean;
}

export function CampaignStatusBadge({
  status,
  scheduledAt,
  sentAt,
  showTime = false,
}: CampaignStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          textColor: 'text-gray-400',
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-teal-500/10',
          borderColor: 'border-teal-500/20',
          textColor: 'text-teal-400',
          time: scheduledAt ? `Sends ${getRelativeTime(scheduledAt)}` : undefined,
        };
      case 'sending':
        return {
          label: 'Sending',
          icon: (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ),
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          textColor: 'text-blue-400',
        };
      case 'sent':
        return {
          label: 'Sent',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          textColor: 'text-green-400',
          time: sentAt ? `Sent ${getRelativeTime(sentAt)}` : undefined,
        };
      case 'paused':
        return {
          label: 'Paused',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          textColor: 'text-yellow-400',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-400',
        };
      default:
        return {
          label: status,
          icon: null,
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          textColor: 'text-gray-400',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bgColor} ${config.borderColor} ${config.textColor}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>
      {showTime && config.time && (
        <span className="text-xs text-gray-500">{config.time}</span>
      )}
    </div>
  );
}
