import { useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { TASK_STATUSES, toDateInputValue } from '../utils/taskUtils';

const initialForm = {
  title: '',
  startDate: '',
  endDate: '',
  status: 'Not Started',
};

const TaskForm = ({ onSubmit, editedData, onCancelEdit, isSaving }) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editedData) {
      setFormData({
        title: editedData.title || '',
        startDate: toDateInputValue(editedData.startDate),
        endDate: toDateInputValue(editedData.endDate),
        status: editedData.status || 'Not Started',
      });
      return;
    }

    setFormData(initialForm);
  }, [editedData]);

  const updateField = (field, value) => {
    setError('');
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError('Add a clear task title before saving.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Choose both start and due dates.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('Due date must be later than the start date.');
      return;
    }

    await onSubmit({
      title: formData.title.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
    });

    if (!editedData) {
      setFormData(initialForm);
    }
  };

  return (
    <section className="task-form-panel" aria-labelledby="task-form-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Plan your work</span>
          <h2 id="task-form-title">{editedData ? 'Edit task' : 'Add task'}</h2>
        </div>
        <i className="bi bi-plus-circle" />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="taskTitle">
          <Form.Label>Task title</Form.Label>
          <Form.Control
            type="text"
            value={formData.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Prepare portfolio update"
          />
        </Form.Group>

        <div className="form-grid">
          <Form.Group className="mb-3" controlId="taskStartDate">
            <Form.Label>Start date</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="taskEndDate">
            <Form.Label>Due date</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.endDate}
              onChange={(event) => updateField('endDate', event.target.value)}
            />
          </Form.Group>
        </div>

        <Form.Group className="mb-4" controlId="taskStatus">
          <Form.Label>Status</Form.Label>
          <Form.Select value={formData.status} onChange={(event) => updateField('status', event.target.value)}>
            {TASK_STATUSES.filter((status) => status !== 'Overdue' && status !== 'Completed but Overdue').map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ),
            )}
          </Form.Select>
        </Form.Group>

        <div className="form-actions">
          {editedData && (
            <Button type="button" variant="outline-secondary" onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="primary-action" disabled={isSaving}>
            <i className={`bi ${editedData ? 'bi-save2' : 'bi-plus-lg'}`} />
            {isSaving ? 'Saving...' : editedData ? 'Update task' : 'Add task'}
          </Button>
        </div>
      </Form>
    </section>
  );
};

export default TaskForm;
