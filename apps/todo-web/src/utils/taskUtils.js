export const TASK_STATUSES = [
  'Not Started',
  'In Progress',
  'Overdue',
  'Completed',
  'Completed but Overdue',
];

export const getTaskId = (task) => task?.id ?? task?.idTask;

export const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

export const formatDateForBackend = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const formatDisplayDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getComputedStatus = (task, now = new Date()) => {
  const status = task.status || 'Not Started';
  const startDate = task.startDate ? new Date(task.startDate) : null;
  const endDate = task.endDate ? new Date(task.endDate) : null;
  const completedDate = task.completedDate ? new Date(task.completedDate) : null;

  if (status === 'Completed' || status === 'Completed but Overdue') {
    if (completedDate && endDate && completedDate > endDate) {
      return 'Completed but Overdue';
    }
    return status;
  }

  if (endDate && endDate < now) {
    return 'Overdue';
  }

  if (status === 'Not Started' && startDate && startDate <= now) {
    return 'In Progress';
  }

  return status;
};

export const withComputedStatus = (task, now = new Date()) => ({
  ...task,
  status: getComputedStatus(task, now),
});

export const getNextCompletedStatus = (task) =>
  getComputedStatus(task) === 'Overdue' ? 'Completed but Overdue' : 'Completed';

export const isTaskDone = (task) =>
  task.status === 'Completed' || task.status === 'Completed but Overdue' || Boolean(task.completedDate);
