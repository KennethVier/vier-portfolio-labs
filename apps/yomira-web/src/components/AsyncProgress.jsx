export default function AsyncProgress({ title, progress, stages, context }) {
  const activeIndex = progress >= 100
    ? stages.length
    : stages.findIndex((stage) => progress < stage.until);
  const currentStage = progress >= 100
    ? stages.at(-1)
    : stages[Math.max(0, activeIndex)];

  return (
    <section className="async-progress" aria-live="polite" aria-busy={progress < 100}>
      <div className="async-progress-heading">
        <div>
          <span className="eyebrow">{progress < 100 ? "In progress" : "Complete"}</span>
          <h3>{title}</h3>
        </div>
        <strong>{progress}%</strong>
      </div>
      {context && <p className="async-context">{context}</p>}
      <div
        className="async-progress-track"
        role="progressbar"
        aria-label={title}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="async-status">{currentStage.detail}</p>
      <ol className="async-stages">
        {stages.map((stage, index) => {
          const state = index < activeIndex || progress >= 100 ? "complete" : index === activeIndex ? "active" : "pending";
          return <li className={state} key={stage.label}><span aria-hidden="true" />{stage.label}</li>;
        })}
      </ol>
    </section>
  );
}
