import {
  formatSessionDate,
  formatSessionMeta,
  formatSessionStatus,
  formatWeeklyTarget,
} from '../utils/trainingPlan.js';

export default function TrainingPlan({ plan, selectedSessionId, onSelectSession }) {
  if (!plan) {
    return <section className="panel empty-state"><h2>No training plan yet</h2><p>Create your 4-week plan after the runner profile is ready.</p></section>;
  }

  return (
    <section className="panel plan-panel">
      <div className="section-heading">
        <div><p className="eyebrow">4-week roadmap</p><h2>{plan.title}</h2></div>
        <span className={plan.aiGenerated ? 'ai-pill' : 'fallback-pill'}>{plan.aiGenerated ? 'AI generated' : 'Fallback plan'}</span>
      </div>
      <p className="plan-summary">{plan.coachSummary}</p>
      <div className="weeks-grid">
        {plan.weeks.map((week) => (
          <article className="week-card" key={week.id}>
            <div className="week-head">
              <strong>Week {week.weekNumber}</strong>
              <span>{formatWeeklyTarget(week)}</span>
            </div>
            <p>{week.focus}</p>
            <div className="session-list">
              {week.sessions.map((session) => (
                <button className={`session-row ${selectedSessionId === session.id ? 'active' : ''}`} key={session.id} onClick={() => onSelectSession(session)}>
                  <span>{formatSessionDate(session)}</span>
                  <strong>{session.title}</strong>
                  <em>{formatSessionMeta(session)}</em>
                  <small>{formatSessionStatus(session)}</small>
                  {session.coachNotes && <p>{session.coachNotes}</p>}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
