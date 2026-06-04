import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Avatar from '../../components/ui/Avatar.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import RoleNotice from '../../components/ui/RoleNotice.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { getRoleProfile, roleCan } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useDepartments, useEmployees } from '../../hooks/usePeopleOps.js';
import { createEmployee, updateEmployee } from '../../api/peopleOpsApi.js';
import { formatDate, prettyEnum } from '../../utils/formatters.js';
import { downloadCsv } from '../../utils/csv.js';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', jobTitle: '', departmentId: '', managerId: '',
  status: 'ACTIVE', employmentType: 'FULL_TIME', startDate: '', location: 'Manila, PH'
};

const directoryCopy = {
  Admin: 'Search, filter, maintain, and export the simulated workforce roster.',
  Manager: 'Search the roster with read-only team visibility for this demo role.',
  Employee: 'Browse the company directory and understand where teams fit.'
};

const Employees = () => {
  const [filters, setFilters] = useState({ search: '', department: '', status: '', employmentType: '', sort: 'name' });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);
  const canManage = roleCan(role, 'manageEmployees');
  const employees = useEmployees(filters);
  const departments = useDepartments();
  const managers = useMemo(() => (employees.data ?? []).filter((item) => item.status !== 'INACTIVE'), [employees.data]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const editEmployee = (employee) => {
    setEditing(employee.id);
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone ?? '',
      jobTitle: employee.jobTitle,
      departmentId: employee.departmentId ?? '',
      managerId: employee.managerId ?? '',
      status: employee.status,
      employmentType: employee.employmentType,
      startDate: employee.startDate ?? '',
      location: employee.location ?? ''
    });
  };

  const exportEmployees = () => {
    downloadCsv('peopleops-employees.csv',
      ['Employee Number', 'Name', 'Email', 'Job Title', 'Department', 'Manager', 'Status', 'Employment Type', 'Start Date', 'Location'],
      (employees.data ?? []).map((employee) => [
        employee.employeeNumber,
        employee.fullName,
        employee.email,
        employee.jobTitle,
        employee.departmentName,
        employee.managerName ?? '',
        prettyEnum(employee.status),
        prettyEnum(employee.employmentType),
        employee.startDate,
        employee.location ?? ''
      ]));
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    const payload = { ...form, departmentId: Number(form.departmentId), managerId: form.managerId ? Number(form.managerId) : null };
    if (editing) {
      await updateEmployee(editing, payload);
      setMessage('Employee profile updated.');
    } else {
      await createEmployee(payload);
      setMessage('Employee created.');
    }
    setForm(emptyForm);
    setEditing(null);
    employees.refetch();
    departments.refetch();
  };

  return (
    <main className="page-surface">
      <PageHeader
        eyebrow="Directory"
        title="Employee directory"
        copy={directoryCopy[role] ?? directoryCopy.Admin}
        action={<button className="ghost-button" type="button" onClick={exportEmployees} disabled={(employees.data ?? []).length === 0}>Export CSV</button>}
      />
      <div className="workspace-grid">
        <Panel title={editing ? 'Edit employee' : 'Add employee'} eyebrow={canManage ? 'Admin tools' : 'Read only'}>
          {canManage ? (
            <form className="form-grid" onSubmit={saveEmployee}>
              <input required placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              <input required placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <input required placeholder="Job title" value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} />
              <select required value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
                <option value="">Department</option>
                {(departments.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })}>
                <option value="">No manager</option>
                {managers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
              </select>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {['ACTIVE', 'ONBOARDING', 'ON_LEAVE', 'INACTIVE'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
              </select>
              <select value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}>
                {['FULL_TIME', 'PART_TIME', 'CONTRACT'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
              </select>
              <input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              <input placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              <button className="primary-button" type="submit">{editing ? 'Update employee' : 'Create employee'}</button>
              {editing && <button className="ghost-button" type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
            </form>
          ) : <RoleNotice title={`${profile.label} roster view`} message="Employee record changes are reserved for Admin mode in this prototype." />}
          {message && <p className="inline-success">{message}</p>}
        </Panel>

        <Panel title="Roster" eyebrow={role === 'Employee' ? 'Company directory' : 'People'} className="wide-panel">
          <div className="filter-row">
            <input placeholder="Search name, email, role" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
            <select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}>
              <option value="">All departments</option>
              {(departments.data ?? []).map((item) => <option key={item.id}>{item.name}</option>)}
            </select>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['ACTIVE', 'ONBOARDING', 'ON_LEAVE', 'INACTIVE'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
            </select>
            <select value={filters.employmentType} onChange={(event) => updateFilter('employmentType', event.target.value)}>
              <option value="">All types</option>
              {['FULL_TIME', 'PART_TIME', 'CONTRACT'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
            </select>
            <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
              <option value="name">Name</option>
              <option value="startDate">Start date</option>
              <option value="status">Status</option>
            </select>
          </div>
          <StateBlock status={employees.status} errorMessage={employees.error} empty={(employees.data ?? []).length === 0} emptyMessage="No employees match the current filters.">
            <div className="data-table employee-table">
              <div className="table-head"><span>Employee</span><span>Department</span><span>Role</span><span>Manager</span><span>Status</span><span>Start</span><span>Actions</span></div>
              {(employees.data ?? []).map((employee) => (
                <div className="table-row" key={employee.id}>
                  <span className="identity-cell"><Avatar name={employee.fullName} /><span><strong>{employee.fullName}</strong><small>{employee.email}</small></span></span>
                  <span>{employee.departmentName}</span>
                  <span>{employee.jobTitle}</span>
                  <span>{employee.managerName ?? 'Direct report'}</span>
                  <span><StatusPill status={employee.status} /></span>
                  <span>{formatDate(employee.startDate)}</span>
                  <span className="row-actions"><Link className="text-button" to={`/employees/${employee.id}`}>View</Link>{canManage && <button className="text-button" onClick={() => editEmployee(employee)}>Edit</button>}</span>
                </div>
              ))}
            </div>
          </StateBlock>
        </Panel>
      </div>
    </main>
  );
};

export default Employees;
