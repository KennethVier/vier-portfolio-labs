export function formatDate(value) {
  if (!value) return 'Unscheduled';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function formatGoal(goal = '') {
  return goal.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatProfileGoal(profile = {}) {
  return profile.goalText || formatGoal(profile.goal || '');
}

export function completionPercent(completed = 0, planned = 0) {
  if (!planned) return 0;
  return Math.min(100, Math.round((completed / planned) * 100));
}

export function formatDateWithDay(value) {
  if (!value) return 'Unscheduled';
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function formatPlanRange(plan = {}) {
  if (!plan.startDate || !plan.endDate) return 'Plan dates not set';
  return `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`;
}

export function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${value}T00:00:00`);
  return Math.ceil((target - start) / 86400000);
}

export function todayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
