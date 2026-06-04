export function formatDate(value) {
  if (!value) return 'Unscheduled';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function formatGoal(goal = '') {
  return goal.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function completionPercent(completed = 0, planned = 0) {
  if (!planned) return 0;
  return Math.min(100, Math.round((completed / planned) * 100));
}
