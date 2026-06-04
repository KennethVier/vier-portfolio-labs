import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { unlockAdmin } from './adminAuth.js';

const AdminGate = () => {
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const submitPasscode = (event) => {
    event.preventDefault();
    setError('');

    if (unlockAdmin(passcode)) {
      navigate('/admin/products');
      return;
    }

    setError('Invalid admin passcode.');
  };

  return (
    <main className="admin-gate-page">
      <section className="admin-gate-card">
        <span className="eyebrow">Store admin</span>
        <h1>Unlock product management.</h1>
        <p>This prototype uses a local passcode gate. Full auth can replace it later.</p>
        <form onSubmit={submitPasscode}>
          <label>
            Admin passcode
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Enter passcode"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="checkout-error">{error}</p>}
          <button className="btn-primary-shop full" type="submit">Unlock admin</button>
        </form>
      </section>
    </main>
  );
};

export default AdminGate;