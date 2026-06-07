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

export function parseCoachNotes(notes = '') {
  if (!notes || typeof notes !== 'string') {
    return [];
  }

  const labels = ['Warmup', 'Purpose', 'Effort', 'Cooldown', 'Caution'];
  const pattern = new RegExp(`(${labels.join('|')}):`, 'g');
  const matches = [...notes.matchAll(pattern)];

  if (!matches.length) {
    return [{ label: null, text: notes.trim() }];
  }

  return matches
    .map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? notes.length;

      return {
        label: match[1],
        text: notes.slice(start, end).trim(),
      };
    })
    .filter((item) => item.text);
}

export function getMainWorkout(session = {}) {
  if (session.mainWorkout) {
    return session.mainWorkout;
  }

  const meta = formatSessionMeta(session);
  if (session.title && meta) {
    return `${session.title}: complete ${meta} with control and finish feeling steady.`;
  }

  if (session.title) {
    return `${session.title}: keep the effort controlled and listen to your body.`;
  }

  return 'Complete the planned run at an easy, controlled effort.';
}

export function getWeekLabel(week = {}, plan = {}) {
  const focus = String(week.focus || '').toLowerCase();
  if (focus.includes('post-race') || focus.includes('recovery')) {
    return 'Recovery week';
  }
  if (focus.includes('race')) {
    return 'Race week';
  }
  if (focus.includes('taper')) {
    return 'Taper week';
  }
  if (plan.planType === 'RACE_DATE_BASED') {
    return week.weekNumber <= 2 ? 'Base week' : 'Build week';
  }
  return 'Training week';
}
