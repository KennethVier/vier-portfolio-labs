import Avatar from '../../components/ui/Avatar.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { getRoleProfile } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useTeamOverview } from '../../hooks/usePeopleOps.js';

const teamCopy = {
  Admin: 'Review the full reporting structure and team capacity across the organization.',
  Manager: 'Use this demo manager view to understand team ownership and follow-up areas.',
  Employee: 'See where teams sit and how reporting lines connect across the company.'
};

const Team = () => {
  const team = useTeamOverview();
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);

  return (
    <main className="page-surface">
      <PageHeader eyebrow="Reporting structure" title="Team view" copy={teamCopy[role] ?? teamCopy.Admin} />
      <StateBlock status={team.status} errorMessage={team.error} empty={(team.data?.teams ?? []).length === 0} emptyMessage="No manager reporting lines found.">
        <div className="team-grid">
          {(team.data?.teams ?? []).map((group) => (
            <Panel key={group.managerId} className="team-card">
              <div className="team-manager">
                <Avatar name={group.managerName} />
                <div>
                  <h2>{group.managerName}</h2>
                  <p>{group.jobTitle} - {group.departmentName}</p>
                </div>
                <StatusPill status={group.status} />
              </div>
              <div className="role-context-line">{profile.label} focus: {profile.focusAreas.join(', ')}</div>
              <div className="mini-stats team-stats">
                <span>{group.teamHeadcount} reports</span>
                <span>{group.activeCount} active</span>
                <span>{group.onboardingCount} onboarding</span>
                <span>{group.onLeaveCount} on leave</span>
              </div>
              <div className="direct-report-list">
                {group.directReports.map((employee) => (
                  <article key={employee.id}>
                    <Avatar name={employee.fullName} />
                    <div>
                      <strong>{employee.fullName}</strong>
                      <span>{employee.jobTitle} - {employee.departmentName}</span>
                    </div>
                    <StatusPill status={employee.status} />
                  </article>
                ))}
              </div>
            </Panel>
          ))}
        </div>
        {(team.data?.unassignedEmployees ?? []).length > 0 && (
          <Panel title="Unassigned leadership" eyebrow="Top level" className="unassigned-panel">
            <div className="direct-report-list">
              {team.data.unassignedEmployees.map((employee) => (
                <article key={employee.id}>
                  <Avatar name={employee.fullName} />
                  <div>
                    <strong>{employee.fullName}</strong>
                    <span>{employee.jobTitle} - {employee.departmentName}</span>
                  </div>
                  <StatusPill status={employee.status} />
                </article>
              ))}
            </div>
          </Panel>
        )}
      </StateBlock>
    </main>
  );
};

export default Team;
