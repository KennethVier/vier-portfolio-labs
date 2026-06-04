import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import { DemoRoleProvider } from './features/demoAuth/DemoRoleProvider.jsx';
import Dashboard from './features/dashboard/Dashboard.jsx';
import Employees from './features/employees/Employees.jsx';
import EmployeeProfile from './features/employees/EmployeeProfile.jsx';
import Team from './features/team/Team.jsx';
import Departments from './features/departments/Departments.jsx';
import Onboarding from './features/onboarding/Onboarding.jsx';
import Requests from './features/requests/Requests.jsx';
import Activity from './features/activity/Activity.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'employees', element: <Employees /> },
      { path: 'employees/:id', element: <EmployeeProfile /> },
      { path: 'team', element: <Team /> },
      { path: 'departments', element: <Departments /> },
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'requests', element: <Requests /> },
      { path: 'activity', element: <Activity /> }
    ]
  }
]);

const App = () => (
  <DemoRoleProvider>
    <RouterProvider router={router} />
  </DemoRoleProvider>
);

export default App;


