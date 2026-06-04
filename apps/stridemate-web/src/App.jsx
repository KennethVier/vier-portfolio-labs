import { useEffect, useMemo, useState } from 'react';
import { generatePlan, getDashboard, getProfileByEmail, logWorkout, saveProfile } from './api/runningApi.js';
import Dashboard from './components/Dashboard.jsx';
import Insights from './components/Insights.jsx';
import ProfileForm from './components/ProfileForm.jsx';
import TrainingPlan from './components/TrainingPlan.jsx';
import WorkoutLogForm from './components/WorkoutLogForm.jsx';
import { useAsyncAction } from './hooks/useAsyncAction.js';
import { BACKEND_DISABLED_MESSAGE, demoDashboard, shouldUseDemoFallback } from './utils/demoData.js';

export default function App() {
  const [email, setEmail] = useState(localStorage.getItem('stridemateEmail') || '');
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [bootError, setBootError] = useState('');
  const [isDemoFallback, setIsDemoFallback] = useState(false);
  const profileAction = useAsyncAction();
  const planAction = useAsyncAction();
  const logAction = useAsyncAction();

  const activeEmail = profile?.email || email;
  const insights = useMemo(() => dashboard?.recentInsights || [], [dashboard]);

  async function loadDashboard(nextEmail = activeEmail) {
    if (!nextEmail) return;
    setBootError('');
    try {
      const data = await getDashboard(nextEmail);
      setDashboard(data);
      setProfile(data.profile);
      localStorage.setItem('stridemateEmail', data.profile.email);
      const next = data.nextSession || data.currentPlan?.weeks?.flatMap((week) => week.sessions)?.find((session) => session.status === 'PLANNED');
      setSelectedSession((current) => current || next || null);
    } catch (error) {
      if (shouldUseDemoFallback(error)) {
        setDashboard(demoDashboard);
        setProfile(demoDashboard.profile);
        setSelectedSession(demoDashboard.nextSession);
        setIsDemoFallback(true);
        setBootError(BACKEND_DISABLED_MESSAGE);
        return;
      }
      setBootError(error?.response?.status === 404 ? '' : 'StrideMate service is unavailable. Start the running coach backend and gateway, then refresh.');
    }
  }

  useEffect(() => {
    if (!email) return;
    getProfileByEmail(email)
      .then((data) => {
        setProfile(data);
        localStorage.setItem('stridemateEmail', data.email);
        loadDashboard(data.email);
      })
      .catch(() => setProfile(null));
  // Load the last demo runner once on startup; subsequent refreshes are explicit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProfileSubmit(payload) {
    if (isDemoFallback) { setBootError(BACKEND_DISABLED_MESSAGE); return; }
    const saved = await profileAction.run(() => saveProfile(payload));
    if (!saved) return;
    setProfile(saved);
    setEmail(saved.email);
    localStorage.setItem('stridemateEmail', saved.email);
    await loadDashboard(saved.email);
  }

  async function handleGeneratePlan() {
    if (!activeEmail) return;
    const plan = await planAction.run(() => generatePlan({ email: activeEmail, startDate: new Date().toISOString().slice(0, 10) }));
    if (plan) {
      await loadDashboard(activeEmail);
      setSelectedSession(plan.weeks?.[0]?.sessions?.[0] || null);
    }
  }

  async function handleWorkoutLog(payload) {
    if (!selectedSession) return;
    const saved = await logAction.run(() => logWorkout(selectedSession.id, payload));
    if (saved) {
      await loadDashboard(activeEmail);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img src="/images/stridemate-mark.png" alt="StrideMate" />
          <div><strong>StrideMate</strong><span>AI Running Coach</span></div>
        </div>
        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#plan">Training Plan</a>
          <a href="#log">Workout Log</a>
          <a href="#insights">Insights</a>
        </nav>
        <div className="safety-card">
          <strong>Coach boundary</strong>
          <p>Guidance only. Pause and seek medical care for sharp pain, chest discomfort, dizziness, or unusual symptoms.</p>
        </div>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vier performance lab</p>
            <h1>Read the run. Adjust the next stride.</h1>
          </div>
          <form className="email-loader" onSubmit={(event) => { event.preventDefault(); loadDashboard(email); }}>
            <input type="email" placeholder="runner@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            <button>Load</button>
          </form>
        </header>

        {isDemoFallback && <div className="alert demo"><strong>Demo mode</strong> {BACKEND_DISABLED_MESSAGE}</div>}
        {bootError && !isDemoFallback && <div className="alert danger">{bootError}</div>}
        {(profileAction.error || planAction.error || logAction.error) && <div className="alert danger">{profileAction.error || planAction.error || logAction.error}</div>}

        {!profile ? (
          <ProfileForm onSubmit={handleProfileSubmit} isLoading={profileAction.isLoading} />
        ) : (
          <div className="workspace">
            <section id="dashboard">
              <Dashboard dashboard={dashboard} onGeneratePlan={handleGeneratePlan} isGenerating={planAction.isLoading} onRefresh={() => loadDashboard(activeEmail)} />
            </section>
            <section id="plan">
              <TrainingPlan plan={dashboard?.currentPlan} selectedSessionId={selectedSession?.id} onSelectSession={setSelectedSession} />
            </section>
            <section id="log">
              <WorkoutLogForm session={selectedSession} onSubmit={handleWorkoutLog} isLoading={logAction.isLoading} />
            </section>
            <section id="insights">
              <Insights insights={insights} />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}


