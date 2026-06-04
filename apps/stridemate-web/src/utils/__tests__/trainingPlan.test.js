import { describe, expect, it } from 'vitest';
import {
  formatSessionDate,
  formatSessionMeta,
  formatSessionStatus,
  formatWeeklyTarget,
} from '../trainingPlan.js';

describe('training plan display helpers', () => {
  it('formats weekly target mileage clearly', () => {
    expect(formatWeeklyTarget({ targetDistanceKm: 12.5 })).toBe('Target: 12.5 km this week');
  });

  it('formats day-by-day session details', () => {
    const session = {
      scheduledDate: '2026-06-08',
      targetDistanceKm: 3.2,
      targetMinutes: 29,
      intensity: 'easy',
      status: 'PLANNED',
    };

    expect(formatSessionDate(session)).toBe('Jun 8');
    expect(formatSessionMeta(session)).toBe('3.2 km - 29 min - easy effort');
    expect(formatSessionStatus(session)).toBe('planned');
  });
});
