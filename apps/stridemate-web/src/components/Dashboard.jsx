import { completionPercent, formatDate, formatGoal } from '../utils/formatters.js';

export default function Dashboard({ dashboard, onGeneratePlan, isGenerating, onRefresh }) {
  const percent = completionPercent(dashboard?.completedSessions, dashboard?.plannedSessions);
  const profile = dashboard?.profile;
  const next = dashboard?.nextSession;

  return (
    <section className="dashboard-grid">
      <div className="panel hero-card">
        <p className="eyebrow">Supportive analyst coach</p>
        <h1>{profile ? `${profile.name}'s StrideMate dashboard` : 'StrideMate dashboard'}</h1>
        <p>AI-guided running plans that adapt around your goal, workload, fatigue, and safety signals.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onGeneratePlan} disabled={isGenerating}>{isGenerating ? 'Building plan...' : dashboard?.currentPlan ? 'Regenerate 4-week plan' : 'Generate 4-week plan'}</button>
          <button className="ghost-button" onClick={onRefresh}>Refresh coach data</button>
        </div>
      </div>

      <div className="stat-card"><span>Goal</span><strong>{profile ? formatGoal(profile.goal) : 'Not set'}</strong></div>
      <div className="stat-card"><span>Completed km</span><strong>{dashboard?.completedDistanceKm?.toFixed?.(1) || '0.0'}</strong></div>
      <div className="stat-card"><span>Plan progress</span><strong>{percent}%</strong><div className="meter"><i style={{ width: `${percent}%` }} /></div></div>
      <div className="stat-card"><span>Next run</span><strong>{next ? formatDate(next.scheduledDate) : 'Generate plan'}</strong></div>

      <div className="panel next-card">
        <p className="eyebrow">Next session</p>
        {next ? <><h2>{next.title}</h2><p>{next.targetDistanceKm} km · {next.targetMinutes} min · {next.intensity}</p><small>{next.coachNotes}</small></> : <p>No planned session yet. Generate a plan to start training.</p>}
      </div>

      <div className="panel insight-card">
        <p className="eyebrow">Coach insight</p>
        {dashboard?.latestInsight ? <><h2>{dashboard.latestInsight.aiGenerated ? 'AI coach response' : 'Coach fallback response'}</h2><p>{dashboard.latestInsight.feedback}</p><small>{dashboard.latestInsight.safetyNote}</small></> : <p>Log a workout to receive feedback and next-session guidance.</p>}
      </div>
    </section>
  );
}
