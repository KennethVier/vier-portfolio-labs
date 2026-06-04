import MetricCard from '../../components/ui/MetricCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import RoleNotice from '../../components/ui/RoleNotice.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { getRoleProfile } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useDashboard } from '../../hooks/usePeopleOps.js';
import { prettyEnum } from '../../utils/formatters.js';

const roleQueueCopy = {
  Admin: ['leave requests waiting for review', 'employees still onboarding', 'audit-ready operations baseline'],
  Manager: ['team requests needing review', 'new hires to follow up', 'team operations baseline'],
  Employee: ['open requests in the company queue', 'onboarding items visible in demo', 'self-service status baseline']
};

const Dashboard = () => {
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);
  const { data, status, error } = useDashboard();
  const pending = data?.pendingLeaveRequests ?? 0;
  const queueCopy = roleQueueCopy[role] ?? roleQueueCopy.Admin;

  return (
    <main className="page-surface">
      <PageHeader
        eyebrow={profile.dashboardEyebrow}
        title={profile.dashboardTitle}
        copy={profile.dashboardCopy}
      />
      <RoleNotice title={`${profile.label} mode`} message={`${profile.shortDescription} Backend permissions remain open for this portfolio demo.`} />
      <StateBlock status={status} errorMessage={error} empty={!data}>
        <div className="metric-grid">
          <MetricCard label={role === 'Employee' ? 'Company employees' : 'Total employees'} value={data?.totalEmployees ?? 0} detail={role === 'Manager' ? 'Visible for demo team context' : 'Across all departments'} />
          <MetricCard label="Active" value={data?.activeEmployees ?? 0} detail={role === 'Employee' ? 'Current workplace activity' : 'Available workforce'} tone="success" />
          <MetricCard label="Onboarding" value={data?.onboardingEmployees ?? 0} detail={role === 'Employee' ? 'Checklist visibility' : 'New hires in progress'} tone="warning" />
          <MetricCard label={role === 'Employee' ? 'Request queue' : 'Pending requests'} value={pending} detail={pending ? 'Needs attention' : 'All clear'} tone={pending ? 'danger' : 'success'} />
        </div>

        <div className="dashboard-grid">
          <Panel title={role === 'Employee' ? 'Company teams' : 'Department distribution'} eyebrow="Teams">
            <div className="distribution-list">
              {(data?.departmentDistribution ?? []).map((item) => (
                <div className="distribution-row" key={item.departmentName}>
                  <span>{item.departmentName}</span>
                  <div className="bar-track"><span style={{ width: `${Math.max(item.headcount * 8, 12)}%` }} /></div>
                  <strong>{item.headcount}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={role === 'Employee' ? 'Onboarding visibility' : 'Onboarding completion'} eyebrow="Progress">
            <div className="progress-panel">
              <strong>{data?.onboardingCompletionSummary?.completed ?? 0}</strong>
              <span>completed tasks</span>
              <div className="progress-line">
                <span style={{ width: `${data?.onboardingCompletionSummary?.completionRate ?? 0}%` }} />
              </div>
              <small>{data?.onboardingCompletionSummary?.completionRate ?? 0}% completion across open onboarding checklists</small>
            </div>
          </Panel>

          <Panel title={role === 'Admin' ? 'Recent audit activity' : 'Recent updates'} eyebrow="Activity" className="wide-panel">
            <div className="activity-list compact">
              {(data?.recentActivity ?? []).map((item) => (
                <article key={item.id}>
                  <StatusPill status={item.entityType} />
                  <div>
                    <strong>{item.action}</strong>
                    <span>{item.actorName}</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title={role === 'Employee' ? 'Self-service focus' : 'Urgent actions'} eyebrow="Queue">
            <div className="action-stack">
              <div><strong>{pending}</strong><span>{queueCopy[0]}</span></div>
              <div><strong>{data?.onboardingEmployees ?? 0}</strong><span>{queueCopy[1]}</span></div>
              <div><strong>{prettyEnum('ACTIVE')}</strong><span>{queueCopy[2]}</span></div>
            </div>
          </Panel>
        </div>
      </StateBlock>
    </main>
  );
};

export default Dashboard;
