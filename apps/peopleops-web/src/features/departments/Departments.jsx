import { useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import RoleNotice from '../../components/ui/RoleNotice.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import { createDepartment, updateDepartment } from '../../api/peopleOpsApi.js';
import { getRoleProfile, roleCan } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useDepartments, useEmployees } from '../../hooks/usePeopleOps.js';
import { BACKEND_DISABLED_MESSAGE } from '../../utils/demoData.js';

const emptyForm = { name: '', description: '', leadEmployeeId: '', location: 'Manila, PH' };

const Departments = () => {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);
  const canManage = roleCan(role, 'manageDepartments');
  const departments = useDepartments();
  const employees = useEmployees();

  const departmentStats = useMemo(() => {
    const map = new Map();
    (employees.data ?? []).forEach((employee) => {
      const key = employee.departmentName ?? 'Unassigned';
      const current = map.get(key) ?? { total: 0, active: 0, onboarding: 0 };
      current.total += 1;
      if (employee.status === 'ACTIVE') current.active += 1;
      if (employee.status === 'ONBOARDING') current.onboarding += 1;
      map.set(key, current);
    });
    return map;
  }, [employees.data]);

  const saveDepartment = async (event) => {
    event.preventDefault();
    if (departments.isDemoFallback || employees.isDemoFallback) {
      setMessage(BACKEND_DISABLED_MESSAGE);
      return;
    }
    const payload = { ...form, leadEmployeeId: form.leadEmployeeId ? Number(form.leadEmployeeId) : null };
    if (editing) {
      await updateDepartment(editing, payload);
      setMessage('Department updated.');
    } else {
      await createDepartment(payload);
      setMessage('Department created.');
    }
    setForm(emptyForm);
    setEditing(null);
    departments.refetch();
  };

  const editDepartment = (department) => {
    setEditing(department.id);
    setForm({ name: department.name, description: department.description ?? '', leadEmployeeId: department.leadEmployeeId ?? '', location: department.location ?? '' });
  };

  return (
    <main className="page-surface">
      <PageHeader eyebrow="Organization" title="Departments" copy={canManage ? 'Maintain teams, leads, locations, and headcount distribution.' : 'Review department structure, leads, locations, and team distribution in read-only mode.'} />
      <div className="workspace-grid">
        <Panel title={editing ? 'Edit department' : 'Create department'} eyebrow={canManage ? 'Admin tools' : 'Read only'}>
          {canManage ? (
            <form className="form-grid" onSubmit={saveDepartment}>
              <input required placeholder="Department name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <input placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              <select value={form.leadEmployeeId} onChange={(event) => setForm({ ...form, leadEmployeeId: event.target.value })}>
                <option value="">Department lead</option>
                {(employees.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
              </select>
              <textarea required placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <button className="primary-button" type="submit">{editing ? 'Update department' : 'Create department'}</button>
              {editing && <button className="ghost-button" type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
            </form>
          ) : <RoleNotice title={`${profile.label} organization view`} message="Department structure is read-only unless you switch to Admin mode." />}
          {message && <p className="inline-success">{message}</p>}
        </Panel>

        <Panel title="Department roster" eyebrow="Teams" className="wide-panel">
          <StateBlock status={departments.status} errorMessage={departments.error} empty={(departments.data ?? []).length === 0} emptyMessage="No departments found.">
            <div className="card-grid">
              {(departments.data ?? []).map((department) => {
                const stats = departmentStats.get(department.name) ?? { total: 0, active: 0, onboarding: 0 };
                return (
                  <article className="department-card" key={department.id}>
                    <div><h3>{department.name}</h3><p>{department.description}</p></div>
                    <dl><div><dt>Lead</dt><dd>{department.leadEmployeeName ?? 'Unassigned'}</dd></div><div><dt>Location</dt><dd>{department.location}</dd></div></dl>
                    <div className="mini-stats"><span>{stats.total} people</span><span>{stats.active} active</span><span>{stats.onboarding} onboarding</span></div>
                    {canManage && <button className="text-button" onClick={() => editDepartment(department)}>Edit</button>}
                  </article>
                );
              })}
            </div>
          </StateBlock>
        </Panel>
      </div>
    </main>
  );
};

export default Departments;

