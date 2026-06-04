import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Panel from '../../components/ui/Panel.jsx';
import RoleNotice from '../../components/ui/RoleNotice.jsx';
import StateBlock from '../../components/ui/StateBlock.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import { createLeaveRequest, createLeaveRequestComment, reviewLeaveRequest } from '../../api/peopleOpsApi.js';
import { getRoleProfile, roleCan } from '../demoAuth/demoRole.js';
import { useDemoRole } from '../demoAuth/useDemoRole.js';
import { useEmployees, useLeaveRequestComments, useLeaveRequests } from '../../hooks/usePeopleOps.js';
import { formatDate, prettyEnum } from '../../utils/formatters.js';
import { downloadCsv } from '../../utils/csv.js';

const emptyRequest = { employeeId: '', type: 'VACATION', startDate: '', endDate: '', reason: '' };
const requestCopy = {
  Admin: 'Review, comment on, and export organization-wide time-off requests.',
  Manager: 'Review team request pressure and capture manager notes in the approval flow.',
  Employee: 'Submit requests, follow status, and add context through request comments.'
};

const RequestComments = ({ request, role }) => {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const comments = useLeaveRequestComments(request.id);

  const submitComment = async (event) => {
    event.preventDefault();
    await createLeaveRequestComment(request.id, {
      authorName: role === 'Employee' ? request.employeeName : `PeopleOps ${role}`,
      authorRole: role,
      message
    });
    setMessage('');
    comments.refetch();
  };

  return (
    <div className="comments-panel">
      <button className="text-button" type="button" onClick={() => setExpanded((current) => !current)}>
        {expanded ? 'Hide comments' : `View comments (${request.commentCount ?? 0})`}
      </button>
      {expanded && (
        <div className="comment-thread">
          <StateBlock status={comments.status} errorMessage={comments.error} empty={(comments.data ?? []).length === 0} emptyMessage="No comments on this request yet.">
            {(comments.data ?? []).map((comment) => (
              <article className="comment-card" key={comment.id}>
                <div><strong>{comment.authorName}</strong><span>{comment.authorRole} - {formatDate(comment.createdAt)}</span></div>
                <p>{comment.message}</p>
              </article>
            ))}
          </StateBlock>
          <form className="comment-form" onSubmit={submitComment}>
            <input required placeholder={role === 'Employee' ? 'Add context for your request' : 'Add request context or review note'} value={message} onChange={(event) => setMessage(event.target.value)} />
            <button className="primary-button" type="submit" disabled={!message.trim()}>Comment</button>
          </form>
        </div>
      )}
    </div>
  );
};

const Requests = () => {
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [form, setForm] = useState(emptyRequest);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState('');
  const { role } = useDemoRole();
  const profile = getRoleProfile(role);
  const canReview = roleCan(role, 'reviewRequests');
  const canSubmit = roleCan(role, 'submitRequest') || canReview;
  const requests = useLeaveRequests(filters);
  const employees = useEmployees();

  const submitRequest = async (event) => {
    event.preventDefault();
    await createLeaveRequest({ ...form, employeeId: Number(form.employeeId) });
    setForm(emptyRequest);
    setMessage('Leave request submitted.');
    requests.refetch();
  };

  const reviewRequest = async (request, status) => {
    await reviewLeaveRequest(request.id, { status, reviewerNote: notes[request.id] ?? '' });
    setMessage(`Request ${prettyEnum(status).toLowerCase()}.`);
    requests.refetch();
  };

  const exportRequests = () => {
    downloadCsv('peopleops-leave-requests.csv',
      ['Employee', 'Type', 'Start Date', 'End Date', 'Status', 'Reason', 'Reviewer Note'],
      (requests.data ?? []).map((request) => [
        request.employeeName,
        prettyEnum(request.type),
        request.startDate,
        request.endDate,
        prettyEnum(request.status),
        request.reason,
        request.reviewerNote ?? ''
      ]));
  };

  return (
    <main className="page-surface">
      <PageHeader
        eyebrow={role === 'Employee' ? 'Self service' : 'Approvals'}
        title="Leave requests"
        copy={requestCopy[role] ?? requestCopy.Admin}
        action={<button className="ghost-button" type="button" onClick={exportRequests} disabled={(requests.data ?? []).length === 0}>Export CSV</button>}
      />
      <div className="workspace-grid">
        <Panel title={role === 'Employee' ? 'Submit my request' : 'Submit request'} eyebrow={canSubmit ? profile.label : 'Read only'}>
          {canSubmit ? (
            <form className="form-grid" onSubmit={submitRequest}>
              <select required value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}>
                <option value="">Employee</option>
                {(employees.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
              </select>
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                {['VACATION', 'SICK', 'PERSONAL', 'REMOTE_WORK'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
              </select>
              <input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              <input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              <textarea required placeholder="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
              <button className="primary-button" disabled={!form.employeeId || !form.startDate || !form.endDate} type="submit">Submit request</button>
            </form>
          ) : <RoleNotice title={`${profile.label} request view`} message="This role can review and comment, but request submission is shown as self-service in Employee mode." />}
          {message && <p className="inline-success">{message}</p>}
        </Panel>

        <Panel title={canReview ? 'Review queue' : 'Request status'} eyebrow={canReview ? 'Approvals' : 'Self-service'} className="wide-panel">
          {!canReview && <RoleNotice title="Read-only approvals" message="Employee mode can submit and comment, while approve and reject actions stay with Admin and Manager roles." />}
          <div className="filter-row compact-filters">
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">All statuses</option>
              {['PENDING', 'APPROVED', 'REJECTED'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
            </select>
            <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              <option value="">All types</option>
              {['VACATION', 'SICK', 'PERSONAL', 'REMOTE_WORK'].map((item) => <option key={item} value={item}>{prettyEnum(item)}</option>)}
            </select>
          </div>
          <StateBlock status={requests.status} errorMessage={requests.error} empty={(requests.data ?? []).length === 0} emptyMessage="No leave requests found.">
            <div className="request-list">
              {(requests.data ?? []).map((request) => (
                <article className="request-card" key={request.id}>
                  <div>
                    <StatusPill status={request.status} />
                    <h3>{request.employeeName}</h3>
                    <p>{prettyEnum(request.type)} - {formatDate(request.startDate)} to {formatDate(request.endDate)}</p>
                    <small>{request.reason}</small>
                  </div>
                  {canReview && request.status === 'PENDING' && (
                    <div className="review-box">
                      <input placeholder="Reviewer note" value={notes[request.id] ?? ''} onChange={(event) => setNotes({ ...notes, [request.id]: event.target.value })} />
                      <button className="ghost-button" onClick={() => reviewRequest(request, 'REJECTED')}>Reject</button>
                      <button className="primary-button" onClick={() => reviewRequest(request, 'APPROVED')}>Approve</button>
                    </div>
                  )}
                  {request.reviewerNote && <p className="review-note">Note: {request.reviewerNote}</p>}
                  <RequestComments request={request} role={role} />
                </article>
              ))}
            </div>
          </StateBlock>
        </Panel>
      </div>
    </main>
  );
};

export default Requests;
