import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Container, Form, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import TaskSummary from './TaskSummary';
import { addTask, deleteTask, getTasksByUserEmail, updateTask } from '../service/TaskService';
import {
  formatDateForBackend,
  getNextCompletedStatus,
  getTaskId,
  isTaskDone,
  TASK_STATUSES,
  withComputedStatus,
} from '../utils/taskUtils';
import { BACKEND_DISABLED_MESSAGE, demoTasks } from '../utils/demoData';

const sortTasks = (tasks, sortMode) => {
  const sorted = [...tasks];

  if (sortMode === 'due-desc') {
    return sorted.sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0));
  }

  if (sortMode === 'status') {
    const order = ['Overdue', 'In Progress', 'Not Started', 'Completed but Overdue', 'Completed'];
    return sorted.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  }

  return sorted.sort((a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0));
};

const Todo = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortMode, setSortMode] = useState('due-asc');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  const showMessage = (variant, text) => setMessage({ variant, text });

  const loadTasks = useCallback(async (userEmail) => {
    setLoading(true);
    try {
      const fetchedTasks = await getTasksByUserEmail(userEmail);
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
      setIsDemoFallback(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks(demoTasks);
      setIsDemoFallback(true);
      showMessage('warning', BACKEND_DISABLED_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');

    if (!savedEmail) {
      navigate('/ToDoList');
      return;
    }

    setEmail(savedEmail);
    loadTasks(savedEmail);
  }, [loadTasks, navigate]);

  const computedTasks = useMemo(() => tasks.map((task) => withComputedStatus(task)), [tasks]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = computedTasks.filter((task) => {
      const matchesQuery =
        task.title?.toLowerCase().includes(query) || task.status?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return sortTasks(filtered, sortMode);
  }, [computedTasks, search, sortMode, statusFilter]);

  const activeSelection = selectedIds.filter((id) => computedTasks.some((task) => getTaskId(task) === id));

  const syncTaskInState = (updatedTask) => {
    const updatedTaskId = getTaskId(updatedTask);
    setTasks((currentTasks) =>
      currentTasks.map((task) => (getTaskId(task) === updatedTaskId ? { ...task, ...updatedTask } : task)),
    );
  };

  const handleSubmitTask = async (formData) => {
    setSaving(true);
    setMessage(null);

    try {
      if (editingTask) {
        const taskId = getTaskId(editingTask);
        const payload = { ...editingTask, ...formData, email, userEmail: email };
        const updatedTask = await updateTask(taskId, payload);
        syncTaskInState(updatedTask || payload);
        setEditingTask(null);
        showMessage('success', 'Task updated successfully.');
      } else {
        const createdTask = await addTask({ ...formData, email, userEmail: email });
        setTasks((currentTasks) => [...currentTasks, createdTask]);
        showMessage('success', 'Task added successfully.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      showMessage('danger', 'Unable to save the task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTask = async (task) => {
    if (isDemoFallback) { showMessage('warning', BACKEND_DISABLED_MESSAGE); setConfirm(null); return; }
    const completedDate = formatDateForBackend();
    const payload = {
      ...task,
      status: getNextCompletedStatus(task),
      completedDate,
      email,
      userEmail: email,
    };

    setSaving(true);
    try {
      const updatedTask = await updateTask(getTaskId(task), payload);
      syncTaskInState(updatedTask || payload);
      setSelectedIds((current) => current.filter((id) => id !== getTaskId(task)));
      showMessage('success', 'Task marked as completed.');
    } catch (error) {
      console.error('Error completing task:', error);
      showMessage('danger', 'Unable to complete the task.');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const handleDeleteTask = async (task) => {
    setSaving(true);
    try {
      await deleteTask(getTaskId(task));
      setTasks((currentTasks) => currentTasks.filter((item) => getTaskId(item) !== getTaskId(task)));
      setSelectedIds((current) => current.filter((id) => id !== getTaskId(task)));
      showMessage('success', 'Task deleted.');
    } catch (error) {
      console.error('Error deleting task:', error);
      showMessage('danger', 'Unable to delete the task.');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const handleBulkComplete = async () => {
    if (isDemoFallback) { showMessage('warning', BACKEND_DISABLED_MESSAGE); setConfirm(null); return; }
    const selectedTasks = computedTasks.filter((task) => activeSelection.includes(getTaskId(task)) && !isTaskDone(task));
    const completedDate = formatDateForBackend();

    setSaving(true);
    try {
      const updates = await Promise.all(
        selectedTasks.map((task) => {
          const payload = {
            ...task,
            status: getNextCompletedStatus(task),
            completedDate,
            email,
            userEmail: email,
          };
          return updateTask(getTaskId(task), payload).then((updatedTask) => updatedTask || payload);
        }),
      );

      updates.forEach(syncTaskInState);
      setSelectedIds([]);
      showMessage('success', `${updates.length} task${updates.length === 1 ? '' : 's'} completed.`);
    } catch (error) {
      console.error('Error bulk completing tasks:', error);
      showMessage('danger', 'Unable to complete selected tasks.');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const handleBulkDelete = async () => {
    if (isDemoFallback) { showMessage('warning', BACKEND_DISABLED_MESSAGE); setConfirm(null); return; }
    const selectedTasks = computedTasks.filter((task) => activeSelection.includes(getTaskId(task)));

    setSaving(true);
    try {
      await Promise.all(selectedTasks.map((task) => deleteTask(getTaskId(task))));
      setTasks((currentTasks) => currentTasks.filter((task) => !activeSelection.includes(getTaskId(task))));
      setSelectedIds([]);
      showMessage('success', `${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'} deleted.`);
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      showMessage('danger', 'Unable to delete selected tasks.');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const toggleSelect = (taskId) => {
    if (!taskId) return;
    setSelectedIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]));
  };

  const toggleAllVisible = () => {
    const visibleIds = visibleTasks.map(getTaskId).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    navigate('/ToDoList');
  };

  return (
    <div className="dashboard-shell">
      <Container fluid="xxl">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">Focus Dashboard</span>
            <h1>
              TodoFlow <i className="bi bi-list-check" />
            </h1>
          </div>
          <div className="user-chip">
            <i className="bi bi-envelope" />
            <span>{email}</span>
            <Button variant="outline-dark" onClick={logout}>
              <i className="bi bi-box-arrow-right" />
              Logout
            </Button>
          </div>
        </header>

        {isDemoFallback && (
          <Alert variant="warning" className="dashboard-alert">
            <strong>Demo tasks:</strong> {BACKEND_DISABLED_MESSAGE}
          </Alert>
        )}

        {message && (
          <Alert variant={message.variant} dismissible onClose={() => setMessage(null)} className="dashboard-alert">
            {message.text}
          </Alert>
        )}

        <TaskSummary tasks={computedTasks} />

        <main className="dashboard-grid">
          <TaskForm
            onSubmit={handleSubmitTask}
            editedData={editingTask}
            onCancelEdit={() => setEditingTask(null)}
            isSaving={saving}
          />

          <section className="task-workspace" aria-labelledby="task-workspace-title">
            <div className="workspace-heading">
              <div>
                <span className="eyebrow">Task workspace</span>
                <h2 id="task-workspace-title">Your task queue</h2>
              </div>
              <div className="bulk-actions">
                <Button
                  variant="outline-success"
                  disabled={activeSelection.length === 0 || saving}
                  onClick={() => setConfirm({ type: 'bulk-complete' })}
                >
                  <i className="bi bi-check2-all" />
                  Complete
                </Button>
                <Button
                  variant="outline-danger"
                  disabled={activeSelection.length === 0 || saving}
                  onClick={() => setConfirm({ type: 'bulk-delete' })}
                >
                  <i className="bi bi-trash3" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="task-filters">
              <Form.Control
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search task or status"
              />
              <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All">All statuses</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>
              <Form.Select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                <option value="due-asc">Due date: soonest</option>
                <option value="due-desc">Due date: latest</option>
                <option value="status">Status priority</option>
              </Form.Select>
            </div>

            {loading ? (
              <div className="loading-state">
                <Spinner animation="border" role="status" />
                <span>Loading your tasks...</span>
              </div>
            ) : (
              <TaskList
                tasks={visibleTasks}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleAll={toggleAllVisible}
                onEdit={setEditingTask}
                onComplete={(task) => setConfirm({ type: 'complete', task })}
                onDelete={(task) => setConfirm({ type: 'delete', task })}
              />
            )}
          </section>
        </main>
      </Container>

      <Modal show={Boolean(confirm)} onHide={() => setConfirm(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {confirm?.type === 'delete' || confirm?.type === 'bulk-delete' ? 'Delete task' : 'Complete task'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirm?.type === 'complete' && `Mark "${confirm.task.title}" as completed?`}
          {confirm?.type === 'delete' && `Delete "${confirm.task.title}" permanently?`}
          {confirm?.type === 'bulk-complete' && `Complete ${activeSelection.length} selected task(s)?`}
          {confirm?.type === 'bulk-delete' && `Delete ${activeSelection.length} selected task(s) permanently?`}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setConfirm(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={confirm?.type === 'delete' || confirm?.type === 'bulk-delete' ? 'danger' : 'success'}
            disabled={saving}
            onClick={() => {
              if (confirm?.type === 'complete') handleCompleteTask(confirm.task);
              if (confirm?.type === 'delete') handleDeleteTask(confirm.task);
              if (confirm?.type === 'bulk-complete') handleBulkComplete();
              if (confirm?.type === 'bulk-delete') handleBulkDelete();
            }}
          >
            {saving ? 'Working...' : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Todo;



