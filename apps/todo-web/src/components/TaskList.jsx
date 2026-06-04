import { Badge, Button, Form, Table } from 'react-bootstrap';
import { formatDisplayDate, getTaskId, isTaskDone } from '../utils/taskUtils';

const statusClassMap = {
  'Not Started': 'status-neutral',
  'In Progress': 'status-progress',
  Overdue: 'status-overdue',
  Completed: 'status-completed',
  'Completed but Overdue': 'status-warning',
};

const TaskStatus = ({ status }) => (
  <Badge className={`status-pill ${statusClassMap[status] || 'status-neutral'}`}>{status}</Badge>
);

const TaskActions = ({ task, onEdit, onComplete, onDelete }) => {
  const done = isTaskDone(task);

  return (
    <div className="task-actions">
      <Button
        type="button"
        variant="outline-success"
        className="icon-btn"
        onClick={() => onComplete(task)}
        disabled={done}
        aria-label="Complete task"
      >
        <i className="bi bi-check2" />
      </Button>
      <Button
        type="button"
        variant="outline-primary"
        className="icon-btn"
        onClick={() => onEdit(task)}
        disabled={done}
        aria-label="Edit task"
      >
        <i className="bi bi-pencil-square" />
      </Button>
      <Button
        type="button"
        variant="outline-danger"
        className="icon-btn"
        onClick={() => onDelete(task)}
        aria-label="Delete task"
      >
        <i className="bi bi-trash3" />
      </Button>
    </div>
  );
};

const EmptyState = () => (
  <div className="empty-state">
    <i className="bi bi-calendar2-check" />
    <h3>No tasks found</h3>
    <p>Create a task or adjust your filters to bring work back into view.</p>
  </div>
);

const TaskList = ({
  tasks,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onEdit,
  onComplete,
  onDelete,
}) => {
  const allSelected = tasks.length > 0 && tasks.every((task) => selectedIds.includes(getTaskId(task)));

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="task-table-wrap">
        <Table responsive className="task-table align-middle">
          <thead>
            <tr>
              <th>
                <Form.Check checked={allSelected} onChange={onToggleAll} aria-label="Select all visible tasks" />
              </th>
              <th>Task</th>
              <th>Status</th>
              <th>Start</th>
              <th>Due</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const taskId = getTaskId(task);
              return (
                <tr key={taskId || task.title}>
                  <td>
                    <Form.Check
                      checked={selectedIds.includes(taskId)}
                      onChange={() => onToggleSelect(taskId)}
                      aria-label={`Select ${task.title}`}
                    />
                  </td>
                  <td>
                    <strong>{task.title}</strong>
                  </td>
                  <td>
                    <TaskStatus status={task.status} />
                  </td>
                  <td>{formatDisplayDate(task.startDate)}</td>
                  <td>{formatDisplayDate(task.endDate)}</td>
                  <td>{task.completedDate ? formatDisplayDate(task.completedDate) : 'Open'}</td>
                  <td>
                    <TaskActions task={task} onEdit={onEdit} onComplete={onComplete} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <div className="task-card-list">
        {tasks.map((task) => {
          const taskId = getTaskId(task);
          return (
            <article className="task-card" key={taskId || task.title}>
              <div className="task-card-top">
                <Form.Check
                  checked={selectedIds.includes(taskId)}
                  onChange={() => onToggleSelect(taskId)}
                  aria-label={`Select ${task.title}`}
                />
                <TaskStatus status={task.status} />
              </div>
              <h3>{task.title}</h3>
              <dl>
                <div>
                  <dt>Start</dt>
                  <dd>{formatDisplayDate(task.startDate)}</dd>
                </div>
                <div>
                  <dt>Due</dt>
                  <dd>{formatDisplayDate(task.endDate)}</dd>
                </div>
                <div>
                  <dt>Completed</dt>
                  <dd>{task.completedDate ? formatDisplayDate(task.completedDate) : 'Open'}</dd>
                </div>
              </dl>
              <TaskActions task={task} onEdit={onEdit} onComplete={onComplete} onDelete={onDelete} />
            </article>
          );
        })}
      </div>
    </>
  );
};

export default TaskList;
