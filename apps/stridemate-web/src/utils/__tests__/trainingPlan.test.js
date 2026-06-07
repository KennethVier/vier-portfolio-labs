import { describe, expect, it } from 'vitest';
import {
  formatSessionDate,
  formatSessionMeta,
  formatSessionStatus,
  formatWeeklyTarget,
  getMainWorkout,
  getWeekLabel,
  parseCoachNotes,
} from '../trainingPlan.js';

describe('training plan display helpers', () => {
  it('formats weekly target mileage clearly', () => {
    expect(formatWeeklyTarget({ targetDistanceKm: 12.5 })).toBe('Target: 12.5 km this week');
  });

  it('formats day-by-day session details without target minutes', () => {
    const session = {
      scheduledDate: '2026-06-08',
      targetDistanceKm: 3.2,
      targetMinutes: 29,
      intensity: 'easy',
      status: 'PLANNED',
    };

    expect(formatSessionDate(session)).toBe('Jun 8');
    expect(formatSessionMeta(session)).toBe('3.2 km - easy effort');
    expect(formatSessionStatus(session)).toBe('planned');
  });

  it('shows the main workout as the primary session instruction', () => {
    expect(getMainWorkout({ mainWorkout: 'Run 4 km easy with relaxed breathing.', title: 'Easy run' })).toBe(
      'Run 4 km easy with relaxed breathing.',
    );

    expect(getMainWorkout({ title: 'Steady long run', targetDistanceKm: 8, intensity: 'easy' })).toBe(
      'Steady long run: complete 8.0 km - easy effort with control and finish feeling steady.',
    );
  });


  it('labels race-date plan weeks clearly', () => {
    expect(getWeekLabel({ weekNumber: 1, focus: 'Base building' }, { planType: 'RACE_DATE_BASED' })).toBe('Base week');
    expect(getWeekLabel({ weekNumber: 5, focus: 'Race week' }, { planType: 'RACE_DATE_BASED' })).toBe('Race week');
    expect(getWeekLabel({ weekNumber: 6, focus: 'Post-race recovery' }, { planType: 'RACE_DATE_BASED' })).toBe('Recovery week');
  });

  it('splits labeled coach notes into readable guidance sections', () => {
    const notes = 'Warmup: 5 minutes easy jog. Purpose: Build aerobic consistency. Effort: Conversational. Cooldown: Walk easy. Caution: Stop if symptoms appear.';

    expect(parseCoachNotes(notes)).toEqual([
      { label: 'Warmup', text: '5 minutes easy jog.' },
      { label: 'Purpose', text: 'Build aerobic consistency.' },
      { label: 'Effort', text: 'Conversational.' },
      { label: 'Cooldown', text: 'Walk easy.' },
      { label: 'Caution', text: 'Stop if symptoms appear.' },
    ]);
  });
});

