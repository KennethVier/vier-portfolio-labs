import { useParams } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { useEmployeeActivity, useEmployeeDetail, useEmployeeOnboarding, useLeaveRequests } from '../../hooks/usePeopleOps.js';
import { formatDate, prettyEnum } from '../../utils/formatters.js';

const EmployeeProfile = () => {
  const { id } = useParams();
  const employee = useEmployeeDetail(id);
  const onboarding = useEmployeeOnboarding(id);
  const requests = useLeaveRequests({ employeeId: id });
  const activity = useEmployeeActivity(id);

  return (
    <main className="page-surface">
      <StateBlock status={employee.status} errorMessage={employee.error} empty={!employee.data} emptyMessage="Employee profile was not found.">
        <PageHeader
          eyebrow="Employee profile"
          title={employee.data?.fullName}
          copy={`${employee.data?.jobTitle ?? ''} - ${employee.data?.departmentName ?? 'Unassigned'}`}
          action={<StatusPill status={employee.data?.status} />}
        />
        <section className="profile-hero panel">
          <Avatar name={employee.data?.fullName} />
          <div>
            <h2>{employee.data?.fullName}</h2>
            <p>{employee.data?.email}</p>
          </div>
          <div className="profile-meta"><span>Manager</span><strong>{employee.data?.managerName ?? 'Direct report'}</strong></div>
          <div className="profile-meta"><span>Location</span><strong>{employee.data?.location ?? 'Not set'}</strong></div>
          <div className="profile-meta"><span>Start date</span><strong>{formatDate(employee.data?.startDate)}</strong></div>
        </section>

        <div className="dashboard-grid profile-grid">
          <Panel title="Overview" eyebrow="Details">
            <dl className="detail-list">
              <div><dt>Phone</dt><dd>{employee.data?.phone ?? 'Not set'}</dd></div>
              <div><dt>Employment type</dt><dd>{prettyEnum(employee.data?.employmentType)}</dd></div>
              <div><dt>Department</dt><dd>{employee.data?.departmentName}</dd></div>
              <div><dt>Employee number</dt><dd>{employee.data?.employeeNumber}</dd></div>
            </dl>
          </Panel>

          <Panel title="Onboarding" eyebrow="Checklist">
            <StateBlock status={onboarding.status} errorMessage={onboarding.error} empty={(onboarding.data ?? []).length === 0} emptyMessage="No onboarding tasks for this employee.">
              <div className="task-list">
                {(onboarding.data ?? []).map((task) => (
                  <article key={task.id}><StatusPill status={task.status} /><div><strong>{task.title}</strong><span>Due {formatDate(task.dueDate)}</span></div></article>
                ))}
              </div>
            </StateBlock>
          </Panel>

          <Panel title="Leave history" eyebrow="Requests">
            <StateBlock status={requests.status} errorMessage={requests.error} empty={(requests.data ?? []).length === 0} emptyMessage="No leave requests yet.">
              <div className="task-list">
                {(requests.data ?? []).map((request) => (
                  <article key={request.id}><StatusPill status={request.status} /><div><strong>{prettyEnum(request.type)}</strong><span>{formatDate(request.startDate)} to {formatDate(request.endDate)}</span></div></article>
                ))}
              </div>
            </StateBlock>
          </Panel>

          <Panel title="Profile activity" eyebrow="Audit" className="wide-panel">
            <StateBlock status={activity.status} errorMessage={activity.error} empty={(activity.data ?? []).length === 0} emptyMessage="No activity recorded for this employee.">
              <div className="activity-list compact">
                {(activity.data ?? []).map((item) => <article key={item.id}><StatusPill status={item.entityType} /><div><strong>{item.action}</strong><span>{item.actorName} - {formatDate(item.createdAt)}</span></div></article>)}
              </div>
            </StateBlock>
          </Panel>
        </div>
      </StateBlock>
    </main>
  );
};

export default EmployeeProfile;
