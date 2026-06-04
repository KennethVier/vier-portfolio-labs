const PageHeader = ({ eyebrow, title, copy, action }) => (
  <section className="page-header">
    <div>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </div>
    {action}
  </section>
);

export default PageHeader;