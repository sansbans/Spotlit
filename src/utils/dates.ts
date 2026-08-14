import { DailyLog, PatchStats } from '../types';

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysElapsed(startDate: string): number {
  return daysBetween(startDate, todayString()) + 1;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function formatTime(timeStr: string): string {
  // timeStr = HH:MM
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatRelativeTime(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function computeStats(logs: DailyLog[], startDate: string, targetDays: number): PatchStats {
  const today = todayString();
  const logMap = new Map(logs.map((l) => [l.date, l]));

  const loggedToday = logMap.has(today);
  const lastLogDate = logs.length > 0 ? logs[logs.length - 1].date : null;

  // Current streak: consecutive days back from today (or yesterday if not logged today)
  let streak = 0;
  let checkDate = today;
  if (!loggedToday) {
    checkDate = addDays(today, -1);
  }
  while (logMap.has(checkDate)) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  // Longest streak
  let longest = 0;
  let current = 0;
  const sortedDates = logs.map((l) => l.date).sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const diff = daysBetween(sortedDates[i - 1], sortedDates[i]);
      current = diff === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
  }

  const totalLogged = logs.length;
  const progressPercent = Math.min(100, Math.round((totalLogged / targetDays) * 100));

  return {
    currentStreak: streak,
    longestStreak: longest,
    totalLogged,
    progressPercent,
    lastLogDate,
    loggedToday,
  };
}

export function getDayNumber(startDate: string, date: string): number {
  return daysBetween(startDate, date) + 1;
}
