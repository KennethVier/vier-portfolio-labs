import { completionPercent, daysUntil, formatDate, formatDateWithDay, formatPlanRange, formatProfileGoal, todayInputValue } from '../utils/formatters.js';
import { formatSessionMeta, getMainWorkout, parseCoachNotes } from '../utils/trainingPlan.js';

function NextSessionGuidance({ notes }) {
  const guidance = parseCoachNotes(notes);
  const caution = guidance.find((item) => item.label === 'Caution');
  const primary = guidance.find((item) => item.label === 'Purpose') || guidance[0];

  if (!primary) {
    return null;
  }

  return (
    <small>
      {primary.label && <strong>{primary.label}: </strong>}
      {primary.text}
      {caution && <> <strong>Caution: </strong>{caution.text}</>}
    </small>
  );
}

export default function Dashboard({ dashboard, planTiming, onPlanTimingChange, onGeneratePlan, isGenerating, onRefresh }) {
  const percent = completionPercent(dashboard?.completedSessions, dashboard?.plannedSessions);
  const profile = dashboard?.profile;
  const next = dashboard?.nextSession;
  const plan = dashboard?.currentPlan;
  const raceCountdown = daysUntil(plan?.raceDate || planTiming?.raceDate);
  const timing = planTiming || { startDate: todayInputValue(), raceDate: '' };

  function updateTiming(field, value) {
    onPlanTimingChange?.((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="dashboard-grid">
      <div className="panel hero-card">
        <p className="eyebrow">Supportive analyst coach</p>
        <h1>{profile ? `${profile.name}'s StrideMate dashboard` : 'StrideMate dashboard'}</h1>
        <p>AI-guided running plans that adapt around your goal, workload, fatigue, and safety signals.</p>
        <div className="plan-timing-card">
          <div className="plan-timing-copy">
            <strong>Plan timing</strong>
            <span>{plan?.planType === 'RACE_DATE_BASED' ? 'Race-date plan with post-race recovery' : 'Choose when this training block should start'}</span>
          </div>
          <label>Training start date<input type="date" value={timing.startDate || todayInputValue()} onChange={(event) => updateTiming('startDate', event.target.value)} /></label>
          <label>Race date optional<input type="date" value={timing.raceDate || ''} min={timing.startDate || todayInputValue()} onChange={(event) => updateTiming('raceDate', event.target.value)} /></label>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onGeneratePlan} disabled={isGenerating}>{isGenerating ? 'Building plan...' : dashboard?.currentPlan ? 'Regenerate plan' : 'Generate plan'}</button>
          <button className="ghost-button" onClick={onRefresh}>Refresh dashboard</button>
        </div>
      </div>

      <div className="stat-card"><span>Goal</span><strong>{profile ? formatProfileGoal(profile) : 'Not set'}</strong></div>
      <div className="stat-card"><span>Completed km</span><strong>{dashboard?.completedDistanceKm?.toFixed?.(1) || '0.0'}</strong></div>
      <div className="stat-card"><span>Plan progress</span><strong>{percent}%</strong><div className="meter"><i style={{ width: `${percent}%` }} /></div></div>

      <div className="stat-card date-stat"><span>Plan range</span><strong>{plan ? formatPlanRange(plan) : 'Not planned'}</strong></div>
      <div className="stat-card date-stat"><span>Race date</span><strong>{plan?.raceDate ? formatDate(plan.raceDate) : timing.raceDate ? formatDate(timing.raceDate) : 'Optional'}</strong>{raceCountdown !== null && <small>{raceCountdown < 0 ? 'Race date passed' : raceCountdown === 0 ? 'Race day' : `${raceCountdown} days out`}</small>}</div>

      <div className="panel next-card">
        <p className="eyebrow">Next session</p>
        {next ? <><span className="next-date-label">{formatDateWithDay(next.scheduledDate)}</span><h2>{next.title}</h2><p>{formatSessionMeta(next)}</p><div className="main-workout-box compact"><span>Main Workout</span><p>{getMainWorkout(next)}</p></div><NextSessionGuidance notes={next.coachNotes} /></> : <p>No planned session yet. Generate a plan to start training.</p>}
      </div>


      {plan?.raceStrategy && (
        <div className="panel race-strategy-card">
          <p className="eyebrow">Race strategy</p>
          <p>{plan.raceStrategy}</p>
        </div>
      )}

      <div className="panel insight-card">
        <p className="eyebrow">Coach insight</p>
        {dashboard?.latestInsight ? <><h2>{dashboard.latestInsight.aiGenerated ? 'AI coach response' : 'Coach fallback response'}</h2><p>{dashboard.latestInsight.feedback}</p><small>{dashboard.latestInsight.safetyNote}</small></> : <p>Log a workout to receive feedback and next-session guidance.</p>}
      </div>
    </section>
  );
}



