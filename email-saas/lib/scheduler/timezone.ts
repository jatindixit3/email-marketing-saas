// Timezone Utilities for Campaign Scheduling
// Handles timezone conversions between user timezone and UTC

import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Common timezones
 */
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  { value: 'UTC', label: 'UTC' },
] as const;

export type TimezoneValue = typeof TIMEZONES[number]['value'];

/**
 * Get user's browser timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert user's local time to UTC
 * @param dateTime - Date string in user's timezone
 * @param userTimezone - User's timezone (e.g., 'America/New_York')
 * @returns UTC Date object
 */
export function toUTC(dateTime: string | Date, userTimezone: string): Date {
  const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return fromZonedTime(date, userTimezone);
}

/**
 * Convert UTC to user's local time
 * @param utcDate - UTC Date object
 * @param userTimezone - User's timezone
 * @returns Date in user's timezone
 */
export function fromUTC(utcDate: Date | string, userTimezone: string): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, userTimezone);
}

/**
 * Format date in user's timezone
 * @param date - Date to format
 * @param userTimezone - User's timezone
 * @param formatString - Format string (default: 'PPpp')
 * @returns Formatted date string
 */
export function formatInUserTimezone(
  date: Date | string,
  userTimezone: string,
  formatString: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, userTimezone, formatString);
}

/**
 * Check if scheduled time is in the past
 * @param scheduledTime - Scheduled time in UTC
 * @returns true if in the past
 */
export function isInPast(scheduledTime: Date | string): boolean {
  const date = typeof scheduledTime === 'string' ? parseISO(scheduledTime) : scheduledTime;
  return date < new Date();
}

/**
 * Check if scheduled time is within next N minutes
 * @param scheduledTime - Scheduled time in UTC
 * @param minutes - Minutes to check
 * @returns true if within time window
 */
export function isWithinMinutes(
  scheduledTime: Date | string,
  minutes: number
): boolean {
  const date = typeof scheduledTime === 'string' ? parseISO(scheduledTime) : scheduledTime;
  const now = new Date();
  const futureTime = new Date(now.getTime() + minutes * 60 * 1000);

  return date >= now && date <= futureTime;
}

/**
 * Get timezone abbreviation
 * @param timezone - Timezone identifier
 * @returns Timezone abbreviation (e.g., 'EST', 'PST')
 */
export function getTimezoneAbbreviation(timezone: string): string {
  const date = new Date();
  const formatted = formatInTimeZone(date, timezone, 'zzz');
  return formatted;
}

/**
 * Get timezone offset in hours
 * @param timezone - Timezone identifier
 * @returns Offset in hours (e.g., -5, +1)
 */
export function getTimezoneOffset(timezone: string): number {
  const date = new Date();
  const formatted = formatInTimeZone(date, timezone, 'XXX');
  const hours = parseInt(formatted.split(':')[0], 10);
  return hours;
}

/**
 * Validate timezone string
 * @param timezone - Timezone to validate
 * @returns true if valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get recommended send times (in user's timezone)
 * Returns common optimal email send times
 */
export function getRecommendedSendTimes(): { label: string; hour: number }[] {
  return [
    { label: '6:00 AM - Early Birds', hour: 6 },
    { label: '9:00 AM - Morning Commute', hour: 9 },
    { label: '12:00 PM - Lunch Time', hour: 12 },
    { label: '3:00 PM - Afternoon Break', hour: 15 },
    { label: '6:00 PM - After Work', hour: 18 },
    { label: '8:00 PM - Evening', hour: 20 },
  ];
}

/**
 * Format relative time until scheduled send
 * @param scheduledTime - Scheduled time in UTC
 * @returns Human-readable relative time
 */
export function getRelativeTime(scheduledTime: Date | string): string {
  const date = typeof scheduledTime === 'string' ? parseISO(scheduledTime) : scheduledTime;
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) {
    return 'In the past';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `In ${days} day${days > 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `In ${hours} hour${hours > 1 ? 's' : ''}`;
  }

  if (minutes > 0) {
    return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return 'Very soon';
}

/**
 * Parse datetime-local input to UTC
 * Browser datetime-local inputs are in user's local timezone
 * @param datetimeLocal - datetime-local value (YYYY-MM-DDTHH:mm)
 * @param userTimezone - User's timezone
 * @returns UTC Date object
 */
export function parseLocalDateTime(
  datetimeLocal: string,
  userTimezone: string
): Date {
  // datetime-local format: 2024-12-25T10:30
  return toUTC(datetimeLocal, userTimezone);
}

/**
 * Format UTC date for datetime-local input
 * @param utcDate - UTC Date object
 * @param userTimezone - User's timezone
 * @returns datetime-local format string
 */
export function formatForLocalInput(
  utcDate: Date | string,
  userTimezone: string
): string {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const zonedDate = fromUTC(date, userTimezone);

  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
}
