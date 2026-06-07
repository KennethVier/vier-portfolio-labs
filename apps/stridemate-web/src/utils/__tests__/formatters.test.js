import { describe, expect, it, vi } from 'vitest';
import { daysUntil, formatDateWithDay, formatPlanRange, todayInputValue } from '../formatters.js';

describe('date formatters', () => {
  it('formats plan ranges and dates with weekday labels', () => {
    expect(formatPlanRange({ startDate: '2026-06-05', endDate: '2026-07-02' })).toBe('Jun 5 - Jul 2');
    expect(formatDateWithDay('2026-06-05')).toBe('Friday, Jun 5');
  });

  it('calculates race countdown from the local current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-05T08:00:00'));
    expect(daysUntil('2026-06-05')).toBe(0);
    expect(daysUntil('2026-06-08')).toBe(3);
    vi.useRealTimers();
  });

  it('creates a date input value for today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-05T08:00:00'));
    expect(todayInputValue()).toBe('2026-06-05');
    vi.useRealTimers();
  });
});

