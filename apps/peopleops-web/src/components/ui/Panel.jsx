const Panel = ({ title, eyebrow, action, children, className = '' }) => (
  <section className={`panel ${className}`}>
    {(title || eyebrow || action) && (
      <div className="panel-header">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {title && <h2>{title}</h2>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export default Panel;