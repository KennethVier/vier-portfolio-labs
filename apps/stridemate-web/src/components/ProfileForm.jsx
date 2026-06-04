import { useState } from 'react';

const initialProfile = {
  email: '',
  name: '',
  goal: 'FIRST_5K',
  level: 'BEGINNER',
  weeklyAvailability: 3,
  recentWeeklyDistanceKm: 8,
  typicalPace: '',
  preferredRunDays: 'Tuesday, Thursday, Saturday',
  healthNotes: '',
};

export default function ProfileForm({ onSubmit, isLoading }) {
  const [profile, setProfile] = useState(initialProfile);

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...profile,
      weeklyAvailability: Number(profile.weeklyAvailability),
      recentWeeklyDistanceKm: Number(profile.recentWeeklyDistanceKm),
    });
  }

  return (
    <form className="panel onboarding-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">Runner calibration</p>
        <h2>Tell the coach what kind of runner you are right now.</h2>
      </div>

      <div className="form-grid">
        <label>Email<input type="email" required value={profile.email} onChange={(e) => update('email', e.target.value)} /></label>
        <label>Name<input required value={profile.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label>Goal<select value={profile.goal} onChange={(e) => update('goal', e.target.value)}><option value="FIRST_5K">First 5K</option><option value="FASTER_5K">Faster 5K</option><option value="FIRST_10K">First 10K</option><option value="CONSISTENCY">Consistency</option><option value="ENDURANCE_BASE">Endurance base</option></select></label>
        <label>Current level<select value={profile.level} onChange={(e) => update('level', e.target.value)}><option value="BEGINNER">Beginner</option><option value="RETURNING">Returning</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></label>
        <label>Runs per week<input type="number" min="1" max="7" value={profile.weeklyAvailability} onChange={(e) => update('weeklyAvailability', e.target.value)} /></label>
        <label>Recent weekly km<input type="number" min="0" step="0.5" value={profile.recentWeeklyDistanceKm} onChange={(e) => update('recentWeeklyDistanceKm', e.target.value)} /></label>
        <label>Typical pace<input placeholder="Optional, e.g. 7:00/km" value={profile.typicalPace} onChange={(e) => update('typicalPace', e.target.value)} /></label>
        <label>Preferred days<input value={profile.preferredRunDays} onChange={(e) => update('preferredRunDays', e.target.value)} /></label>
      </div>

      <label>Health, injury, or limitation notes<textarea rows="4" placeholder="Knee discomfort, asthma, returning from injury, anything the coach should respect." value={profile.healthNotes} onChange={(e) => update('healthNotes', e.target.value)} /></label>
      <button className="primary-button" disabled={isLoading}>{isLoading ? 'Calibrating...' : 'Create runner profile'}</button>
    </form>
  );
}
