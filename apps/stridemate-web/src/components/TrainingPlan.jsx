import {
  formatSessionDate,
  formatSessionMeta,
  formatSessionStatus,
  formatWeeklyTarget,
  getMainWorkout,
  getWeekLabel,
  parseCoachNotes,
} from '../utils/trainingPlan.js';

function SessionGuidance({ notes }) {
  const guidance = parseCoachNotes(notes);

  if (!guidance.length) {
    return null;
  }

  return (
    <div className="session-guidance">
      {guidance.map((item, index) => (
        <p key={`${item.label || 'note'}-${index}`}>
          {item.label && <strong>{item.label}</strong>}
          <span>{item.text}</span>
        </p>
      ))}
    </div>
  );
}

export default function TrainingPlan({ plan, selectedSessionId, onSelectSession }) {
  if (!plan) {
    return <section className="panel empty-state"><h2>No training plan yet</h2><p>Create a plan after the runner profile is ready. Add a race date if you want the plan to build toward an event.</p></section>;
  }

  return (
    <section className="panel plan-panel">
      <div className="section-heading">
        <div><p className="eyebrow">{plan.planType === 'RACE_DATE_BASED' ? 'Race roadmap' : '4-week roadmap'}</p><h2>{plan.title}</h2></div>
        <span className={plan.aiGenerated ? 'ai-pill' : 'fallback-pill'}>{plan.aiGenerated ? 'AI generated' : 'Fallback plan'}</span>
      </div>
      <p className="plan-summary">{plan.coachSummary}</p>
      {plan.raceStrategy && <div className="race-strategy-banner"><span>Race Strategy</span><p>{plan.raceStrategy}</p></div>}
      <div className="weeks-grid">
        {plan.weeks.map((week) => (
          <article className="week-card" key={week.id}>
            <div className="week-head">
              <div><strong>Week {week.weekNumber}</strong><small>{getWeekLabel(week, plan)}</small></div>
              <span>{formatWeeklyTarget(week)}</span>
            </div>
            <p className="week-focus">{week.focus}</p>
            <div className="session-list">
              {week.sessions.map((session) => (
                <button className={`session-row ${selectedSessionId === session.id ? 'active' : ''}`} key={session.id} onClick={() => onSelectSession(session)}>
                  <span className="session-date">{formatSessionDate(session)}</span>
                  <strong>{session.title}</strong>
                  <em>{formatSessionMeta(session)}</em>
                  <small>{formatSessionStatus(session)}</small>
                  <div className="main-workout-box">
                    <span>Main Workout</span>
                    <p>{getMainWorkout(session)}</p>
                  </div>
                  <SessionGuidance notes={session.coachNotes} />
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

