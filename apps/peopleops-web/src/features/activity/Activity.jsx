import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { getRoleProfile } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useActivityLog } from '../../hooks/usePeopleOps.js';
import { formatDate, prettyEnum } from '../../utils/formatters.js';

const defaultFilters = { entityType: '', actorName: '', keyword: '', fromDate: '', toDate: '' };
const activityCopy = {
  Admin: 'Search the audit trail by actor, entity, keyword, and date range.',
  Manager: 'Track team operations updates, request movement, and onboarding changes.',
  Employee: 'Review recent company updates with simple filters for transparency.'
};

const Activity = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);
  const activity = useActivityLog(filters);
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <main className="page-surface">
      <PageHeader eyebrow={role === 'Admin' ? 'Audit trail' : 'Recent updates'} title="Activity log" copy={activityCopy[role] ?? activityCopy.Admin} />
      <Panel title={role === 'Admin' ? 'Audit filters' : 'Activity filters'} eyebrow={profile.label}>
        <div className="filter-row audit-filters">
          <select value={filters.entityType} onChange={(event) => updateFilter('entityType', event.target.value)}>
            <option value="">All entity types</option>
            {['EMPLOYEE', 'DEPARTMENT', 'ONBOARDING', 'LEAVE_REQUEST'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
          </select>
          <input placeholder="Actor name" value={filters.actorName} onChange={(event) => updateFilter('actorName', event.target.value)} />
          <input placeholder="Action keyword" value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} />
          <input type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} />
          <input type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} />
          <button className="ghost-button" type="button" onClick={() => setFilters(defaultFilters)}>Clear</button>
        </div>
      </Panel>
      <Panel title="Recent changes" eyebrow="System activity">
        <StateBlock status={activity.status} errorMessage={activity.error} empty={(activity.data ?? []).length === 0} emptyMessage="No activity matches the current filters.">
          <div className="activity-timeline">
            {(activity.data ?? []).map((item) => (
              <article key={item.id}>
                <StatusPill status={item.entityType} />
                <div><h3>{item.action}</h3><p>{item.actorName}</p></div>
                <time>{formatDate(item.createdAt)}</time>
              </article>
            ))}
          </div>
        </StateBlock>
      </Panel>
    </main>
  );
};

export default Activity;
