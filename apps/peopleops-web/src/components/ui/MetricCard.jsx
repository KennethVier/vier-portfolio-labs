const MetricCard = ({ label, value, detail, tone = 'neutral' }) => (
  <article className={`metric-card ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </article>
);

export default MetricCard;