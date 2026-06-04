export default function Insights({ insights = [] }) {
  return (
    <section className="panel insights-panel">
      <div className="section-heading"><div><p className="eyebrow">Coach memory</p><h2>Recent insights</h2></div></div>
      {insights.length === 0 ? <p>No coach insights yet. Log a workout to start the feedback loop.</p> : (
        <div className="insight-list">
          {insights.map((insight) => (
            <article key={insight.id} className="insight-item">
              <span>{insight.aiGenerated ? 'AI coach' : 'Fallback coach'}</span>
              <p>{insight.feedback}</p>
              <small>{insight.nextAdjustment}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
