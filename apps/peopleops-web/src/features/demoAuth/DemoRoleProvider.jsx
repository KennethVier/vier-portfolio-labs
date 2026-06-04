import { useMemo, useState } from 'react';
import { DemoRoleContext } from './demoRoleContext.js';

export const DemoRoleProvider = ({ children }) => {
  const [role, setRole] = useState(() => localStorage.getItem('peopleops-role') ?? 'Admin');
  const value = useMemo(() => ({
    role,
    setRole: (nextRole) => {
      localStorage.setItem('peopleops-role', nextRole);
      setRole(nextRole);
    }
  }), [role]);

  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
};
