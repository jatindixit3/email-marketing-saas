'use client';

import { useState, useEffect } from 'react';
import { TIMEZONES, getBrowserTimezone, formatForLocalInput, getRelativeTime } from '@/lib/scheduler/timezone';

interface CampaignSchedulerProps {
  campaignId: string;
  currentStatus?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  currentScheduledAt?: string | null;
  currentTimezone?: string | null;
  onScheduled?: () => void;
  onCancelled?: () => void;
}

export function CampaignScheduler({
  campaignId,
  currentStatus = 'draft',
  currentScheduledAt,
  currentTimezone,
  onScheduled,
  onCancelled,
}: CampaignSchedulerProps) {
  const [mode, setMode] = useState<'schedule' | 'view'>('schedule');
  const [timezone, setTimezone] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize timezone and mode
  useEffect(() => {
    const detectedTimezone = currentTimezone || getBrowserTimezone();
    setTimezone(detectedTimezone);

    if (currentStatus === 'scheduled' && currentScheduledAt) {
      setMode('view');
      // Convert UTC to local time for display
      const localTime = formatForLocalInput(currentScheduledAt, detectedTimezone);
      setScheduledTime(localTime);
    }
  }, [currentTimezone, currentStatus, currentScheduledAt]);

  const handleSchedule = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledTime,
          timezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule campaign');
      }

      setSuccess('Campaign scheduled successfully!');
      setMode('view');
      onScheduled?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this scheduled campaign?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel campaign');
      }

      setSuccess('Campaign cancelled successfully!');
      setMode('schedule');
      setScheduledTime('');
      onCancelled?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledTime,
          timezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule campaign');
      }

      setSuccess('Campaign rescheduled successfully!');
      onScheduled?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return formatForLocalInput(now, timezone);
  };

  if (currentStatus === 'sent') {
    return (
      <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
        <div className="flex items-center gap-2 text-green-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Campaign Sent</span>
        </div>
        {currentScheduledAt && (
          <p className="mt-1 text-sm text-gray-400">
            Sent {getRelativeTime(currentScheduledAt)}
          </p>
        )}
      </div>
    );
  }

  if (currentStatus === 'sending') {
    return (
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex items-center gap-2 text-blue-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="font-medium">Campaign Sending</span>
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Emails are being sent to your contacts...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Schedule Campaign</h3>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {mode === 'view' && currentStatus === 'scheduled' ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-teal-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Scheduled</span>
            </div>
            <p className="text-sm text-gray-300">
              Sending {getRelativeTime(currentScheduledAt || '')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(currentScheduledAt || '').toLocaleString()} ({timezone})
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMode('schedule')}
              disabled={loading}
              className="flex-1 rounded-lg border border-purple-500/20 bg-gradient-to-r from-teal-500/10 to-purple-500/10 px-4 py-2 text-sm font-medium text-white transition-all hover:from-teal-500/20 hover:to-purple-500/20 disabled:opacity-50"
            >
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Cancel Schedule'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white backdrop-blur-sm transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-50"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={getMinDateTime()}
              disabled={loading}
              className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white backdrop-blur-sm transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum: 5 minutes from now
            </p>
          </div>

          <div className="flex gap-3">
            {currentStatus === 'scheduled' ? (
              <>
                <button
                  onClick={handleReschedule}
                  disabled={loading || !scheduledTime}
                  className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-6 py-2 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {loading ? 'Rescheduling...' : 'Update Schedule'}
                </button>
                <button
                  onClick={() => setMode('view')}
                  disabled={loading}
                  className="rounded-lg border border-purple-500/20 px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleSchedule}
                disabled={loading || !scheduledTime}
                className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-6 py-2 text-sm font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Campaign'}
              </button>
            )}
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs text-gray-400">
              💡 <strong>Tip:</strong> Your campaign will automatically start sending at the scheduled time. You can cancel or reschedule anytime before it starts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
