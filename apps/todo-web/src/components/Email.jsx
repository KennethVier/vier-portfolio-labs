import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Container, Form, Modal } from 'react-bootstrap';
import { getTasksByUserEmail } from '../service/TaskService';

const Email = () => {
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, []);

  const handleEmailAction = async (event) => {
    event.preventDefault();
    setError('');

    if (!userEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsChecking(true);
    try {
      await getTasksByUserEmail(userEmail.trim());
      localStorage.setItem('userEmail', userEmail.trim());
      setShowWelcome(true);
    } catch (error) {
      console.error('Error processing your email:', error);
      setError('Email is not registered yet. Register first to save tasks and receive notifications.');
    } finally {
      setIsChecking(false);
    }
  };

  const goToRegister = () => {
    navigate('/notificationregister');
  };

  const goToHome = () => {
    window.location.href = import.meta.env.VITE_PORTFOLIO_URL || 'https://vier-main-portfolio.vercel.app/';
  };

  return (
    <div className="auth-shell">
      <Button className="back-link" variant="outline-dark" onClick={goToHome}>
        <i className="bi bi-arrow-left" />
        Portfolio
      </Button>

      <Container className="auth-container">
        <Card className="auth-card">
          <Card.Body>
            <span className="eyebrow">Task notifications</span>
            <h1>Welcome back to TodoFlow</h1>
            <p>Use your registered email to load your task dashboard and notification settings.</p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleEmailAction}>
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={userEmail}
                  onChange={(event) => setUserEmail(event.target.value)}
                />
              </Form.Group>

              <Button type="submit" className="primary-action w-100" disabled={isChecking}>
                <i className="bi bi-arrow-right-circle" />
                {isChecking ? 'Checking...' : 'Proceed to dashboard'}
              </Button>
            </Form>

            <p className="auth-footer">
              No account yet?
              <button type="button" onClick={goToRegister}>
                Register to save your tasks
              </button>
            </p>
          </Card.Body>
        </Card>
      </Container>

      <Modal show={showWelcome} onHide={() => navigate(`/tasks?email=${userEmail}`)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Dashboard ready</Modal.Title>
        </Modal.Header>
        <Modal.Body>Your tasks are ready. Continue to your Focus Dashboard.</Modal.Body>
        <Modal.Footer>
          <Button className="primary-action" onClick={() => navigate(`/tasks?email=${userEmail}`)}>
            Open dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Email;

