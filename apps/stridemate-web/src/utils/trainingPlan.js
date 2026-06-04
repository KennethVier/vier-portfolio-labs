import { formatDate } from './formatters.js';

export function formatWeeklyTarget(week = {}) {
  const target = Number(week.targetDistanceKm || 0).toFixed(1);
  return `Target: ${target} km this week`;
}

export function formatSessionMeta(session = {}) {
  const parts = [];

  if (session.targetDistanceKm) {
    parts.push(`${Number(session.targetDistanceKm).toFixed(1)} km`);
  }

  if (session.targetMinutes) {
    parts.push(`${session.targetMinutes} min`);
  }

  if (session.intensity) {
    parts.push(`${session.intensity} effort`);
  }

  return parts.join(' - ');
}

export function formatSessionStatus(session = {}) {
  return session.status ? session.status.replaceAll('_', ' ').toLowerCase() : 'planned';
}

export function formatSessionDate(session = {}) {
  return formatDate(session.scheduledDate);
}
