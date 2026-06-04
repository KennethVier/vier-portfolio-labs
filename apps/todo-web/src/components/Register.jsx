import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Container, Form, Modal } from 'react-bootstrap';
import { registerUser } from '../service/TaskService';

const Register = () => {
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (!userEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSaving(true);
    try {
      await registerUser(userEmail.trim());
      localStorage.setItem('userEmail', userEmail.trim());
      setShowSuccess(true);
    } catch (error) {
      console.error('Error registering user:', error);
      setError('There was an error registering your email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="auth-shell">
      <Button className="back-link" variant="outline-dark" onClick={() => navigate('/ToDoList')}>
        <i className="bi bi-arrow-left" />
        Login
      </Button>

      <Container className="auth-container">
        <Card className="auth-card">
          <Card.Body>
            <span className="eyebrow">Create workspace</span>
            <h1>Register notifications</h1>
            <p>Register your email so TodoFlow can save tasks and connect them to notification reminders.</p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleRegister}>
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={userEmail}
                  onChange={(event) => setUserEmail(event.target.value)}
                />
              </Form.Group>

              <Button type="submit" className="primary-action w-100" disabled={isSaving}>
                <i className="bi bi-person-plus" />
                {isSaving ? 'Registering...' : 'Register email'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>

      <Modal show={showSuccess} onHide={() => navigate('/ToDoList')} centered>
        <Modal.Header closeButton>
          <Modal.Title>Email registered</Modal.Title>
        </Modal.Header>
        <Modal.Body>Your email is registered. You can now open your task dashboard.</Modal.Body>
        <Modal.Footer>
          <Button className="primary-action" onClick={() => navigate('/ToDoList')}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Register;
