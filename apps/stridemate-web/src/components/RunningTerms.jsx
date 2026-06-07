import { useMemo, useState } from 'react';
import { filterRunningTerms } from '../utils/runningTerms.js';

export default function RunningTerms() {
  const [query, setQuery] = useState('');
  const terms = useMemo(() => filterRunningTerms(query), [query]);

  return (
    <section className="panel terms-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Beginner reference</p>
          <h2>Running Terms</h2>
        </div>
        <input className="terms-search" placeholder="Search terms" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="terms-grid">
        {terms.map((item) => (
          <article className="term-card" key={item.term}>
            <h3>{item.term}</h3>
            <strong>{item.summary}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
