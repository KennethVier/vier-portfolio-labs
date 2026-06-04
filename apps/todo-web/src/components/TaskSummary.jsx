import { Card, Col, Row } from 'react-bootstrap';
import { TASK_STATUSES } from '../utils/taskUtils';

const summaryConfig = [
  { label: 'Total Tasks', icon: 'bi-list-check', className: 'total' },
  { label: 'In Progress', icon: 'bi-lightning-charge', className: 'progress' },
  { label: 'Overdue', icon: 'bi-exclamation-triangle', className: 'overdue' },
  { label: 'Completed', icon: 'bi-check2-circle', className: 'completed' },
];

const TaskSummary = ({ tasks }) => {
  const counts = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status).length;
    return acc;
  }, {});

  const summary = {
    'Total Tasks': tasks.length,
    'In Progress': counts['In Progress'],
    Overdue: counts.Overdue,
    Completed: counts.Completed + counts['Completed but Overdue'],
  };

  return (
    <Row className="g-3 dashboard-summary">
      {summaryConfig.map((item) => (
        <Col xs={6} lg={3} key={item.label}>
          <Card className={`summary-card ${item.className}`}>
            <Card.Body>
              <div className="summary-icon">
                <i className={`bi ${item.icon}`} />
              </div>
              <span>{item.label}</span>
              <strong>{summary[item.label]}</strong>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default TaskSummary;
