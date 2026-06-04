export const BACKEND_DISABLED_MESSAGE = 'Live backend is currently disabled for this portfolio demo. Contact the admin to enable this workflow.';
export const DEMO_FALLBACK_ENABLED = import.meta.env.VITE_DEMO_FALLBACK_ENABLED !== 'false';
export const shouldUseDemoFallback = (error) => DEMO_FALLBACK_ENABLED && (!error?.response || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error');

const profile = {
  id: 1,
  email: 'runner@vierlabs.dev',
  name: 'Mira Santos',
  goal: 'FIRST_10K',
  level: 'RETURNING',
  weeklyAvailability: 3,
  recentWeeklyDistanceKm: 12.5,
  typicalPace: '8:00/km',
  preferredRunDays: 'Tuesday, Thursday, Saturday',
  healthNotes: 'mild knee discomfort'
};

const sessions = [
  { id: 101, scheduledDate: '2026-06-09', type: 'EASY_RUN', status: 'PLANNED', title: 'Easy aerobic run', targetDistanceKm: 3.8, targetMinutes: 32, intensity: 'easy', coachNotes: 'Warmup: 5 minutes brisk walk. Purpose: rebuild aerobic rhythm. Effort: conversational. Cooldown: 5 minutes easy walk. Caution: keep the knee comfortable.' },
  { id: 102, scheduledDate: '2026-06-11', type: 'RECOVERY', status: 'PLANNED', title: 'Recovery run', targetDistanceKm: 3.8, targetMinutes: 34, intensity: 'easy', coachNotes: 'Warmup: start gently. Purpose: practice consistency without chasing pace. Effort: relaxed. Cooldown: walk until breathing settles.' },
  { id: 103, scheduledDate: '2026-06-13', type: 'LONG_RUN', status: 'PLANNED', title: 'Long easy run', targetDistanceKm: 4.9, targetMinutes: 42, intensity: 'easy', coachNotes: 'Warmup: keep the first kilometer gentle. Purpose: extend endurance. Effort: easy enough to talk. Cooldown: short walk and mobility.' }
];

export const demoDashboard = {
  profile,
  currentWeek: 1,
  completedDistanceKm: 7.4,
  completedSessions: 2,
  plannedSessions: 12,
  nextSession: sessions[0],
  currentPlan: {
    id: 1,
    title: 'Demo 4-week first 10K plan',
    coachSummary: 'Demo mode is showing a conservative schedule while the live running coach backend is disabled. The plan starts near the runner current weekly distance and progresses gradually.',
    aiGenerated: false,
    weeks: [
      { id: 1, weekNumber: 1, focus: 'Foundation', targetDistanceKm: 12.5, sessions },
      { id: 2, weekNumber: 2, focus: 'Gentle progression', targetDistanceKm: 13.5, sessions: sessions.map((session, index) => ({ ...session, id: 201 + index, scheduledDate: ['2026-06-16', '2026-06-18', '2026-06-20'][index], targetDistanceKm: [4.1, 4.1, 5.3][index] })) },
      { id: 3, weekNumber: 3, focus: 'Controlled confidence', targetDistanceKm: 14.6, sessions: sessions.map((session, index) => ({ ...session, id: 301 + index, scheduledDate: ['2026-06-23', '2026-06-25', '2026-06-27'][index], targetDistanceKm: [4.4, 4.4, 5.8][index] })) },
      { id: 4, weekNumber: 4, focus: 'Steady finish', targetDistanceKm: 15.8, sessions: sessions.map((session, index) => ({ ...session, id: 401 + index, scheduledDate: ['2026-06-30', '2026-07-02', '2026-07-04'][index], targetDistanceKm: [4.7, 4.7, 6.4][index] })) }
    ]
  },
  latestInsight: { id: 1, feedback: 'Keep this week easy and consistent. If knee discomfort increases, shorten the next run and prioritize recovery.', safetyNote: 'Demo guidance only; do not treat this as medical advice.', aiGenerated: false },
  recentInsights: [
    { id: 1, createdAt: '2026-06-04T09:00:00', feedback: 'Demo coach insight: consistency beats intensity this week.', safetyNote: 'Watch fatigue and pain signals.', aiGenerated: false }
  ]
};
