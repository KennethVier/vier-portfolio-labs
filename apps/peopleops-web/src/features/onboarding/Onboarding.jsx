import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import RoleNotice from '../../components/ui/RoleNotice.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { updateOnboardingTask } from '../../api/peopleOpsApi.js';
import { getRoleProfile, roleCan } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useEmployees, useOnboardingTasks } from '../../hooks/usePeopleOps.js';
import { formatDate, prettyEnum } from '../../utils/formatters.js';

const Onboarding = () => {
  const [filters, setFilters] = useState({ employeeId: '', status: '' });
  const [message, setMessage] = useState('');
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);
  const canUpdate = roleCan(role, 'updateOnboarding');
  const tasks = useOnboardingTasks(filters);
  const employees = useEmployees({ status: 'ONBOARDING' });

  const updateTask = async (task, status) => {
    await updateOnboardingTask(task.id, { status });
    setMessage(`Updated ${task.title}.`);
    tasks.refetch();
  };

  return (
    <main className="page-surface">
      <PageHeader eyebrow="Workflow" title="Onboarding" copy={canUpdate ? 'Manage new-hire readiness tasks, due dates, and completion progress.' : 'View onboarding checklist progress in read-only employee mode.'} />
      <Panel title="Task board" eyebrow={canUpdate ? 'Manager tools' : 'Read only'}>
        <div className="filter-row compact-filters">
          <select value={filters.employeeId} onChange={(event) => setFilters({ ...filters, employeeId: event.target.value })}>
            <option value="">All onboarding employees</option>
            {(employees.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            {['TODO', 'IN_PROGRESS', 'DONE'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
          </select>
        </div>
        {!canUpdate && <RoleNotice title={`${profile.label} checklist view`} message="Task status updates are available to Admin and Manager demo roles." />}
        {message && <p className="inline-success">{message}</p>}
        <StateBlock status={tasks.status} errorMessage={tasks.error} empty={(tasks.data ?? []).length === 0} emptyMessage="No onboarding tasks match these filters.">
          <div className="kanban-list">
            {(tasks.data ?? []).map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-main">
                  <StatusPill status={task.status} />
                  <h3>{task.title}</h3>
                  <p>{task.employeeName}</p>
                </div>
                <div className="task-card-meta"><span>Due {formatDate(task.dueDate)}</span>{task.completedDate && <span>Completed {formatDate(task.completedDate)}</span>}</div>
                {canUpdate && (
                  <div className="segmented-actions">
                    {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => <button key={status} className={task.status === status ? 'active' : ''} onClick={() => updateTask(task, status)}>{prettyEnum(status)}</button>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        </StateBlock>
      </Panel>
    </main>
  );
};

export default Onboarding;
