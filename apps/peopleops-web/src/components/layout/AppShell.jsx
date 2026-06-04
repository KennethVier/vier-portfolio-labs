import { NavLink, Outlet } from 'react-router-dom';
import { DEMO_ROLES, getRoleProfile } from '../../features/demoAuth/demoRole.js';
import { useDemoRole } from '../../features/demoAuth/useDemoRole.js';

const navItems = [
  ['/', 'Dashboard'],
  ['/employees', 'Employees'],
  ['/team', 'Team View'],
  ['/departments', 'Departments'],
  ['/onboarding', 'Onboarding'],
  ['/requests', 'Requests'],
  ['/activity', 'Activity']
];

const AppShell = () => {
  const { role, setRole } = useDemoRole();
  const profile = getRoleProfile(role);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark"><img src="/images/peopleops-mark.png" alt="PeopleOps mark" /></span>
          <div>
            <strong>PeopleOps</strong>
            <span>{profile.workspaceTitle}</span>
          </div>
        </div>
        <div className="sidebar-role-card">
          <span className="role-badge">{profile.label}</span>
          <p>{profile.shortDescription}</p>
          <small>Demo permissions only</small>
        </div>
        <nav className="side-nav" aria-label="PeopleOps navigation">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <label className="global-search">
            <span>Search</span>
            <input placeholder="Find employees, requests, departments" />
          </label>
          <div className="topbar-role-context">
            <span className="role-badge subtle">{profile.label}</span>
            <small>{profile.focusAreas.join(' / ')}</small>
          </div>
          <label className="role-switcher">
            Demo role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {DEMO_ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </header>
        <Outlet />
      </div>
    </div>
  );
};

export default AppShell;

