import { useMemo, useState } from 'react';
import { extractRunDetailsFromImage } from '../utils/ocrParser.js';

const emptyLog = {
  source: 'MANUAL',
  distanceKm: '',
  durationMinutes: '',
  pace: '',
  perceivedEffort: 5,
  fatigueLevel: 4,
  painLevel: 0,
  completionStatus: 'COMPLETED',
  notes: '',
};

export default function WorkoutLogForm({ session, onSubmit, isLoading }) {
  const [log, setLog] = useState(emptyLog);
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawText, setRawText] = useState('');

  const canSubmit = useMemo(() => session && !isLoading, [session, isLoading]);

  function update(field, value) {
    setLog((current) => ({ ...current, [field]: value }));
  }

  async function analyzeScreenshot(file) {
    if (!file) return;
    setOcrStatus('reading');
    setOcrProgress(0);
    try {
      const result = await extractRunDetailsFromImage(file, setOcrProgress);
      setRawText(result.rawText);
      setLog((current) => ({
        ...current,
        source: 'SCREENSHOT_OCR',
        distanceKm: result.values.distanceKm ?? current.distanceKm,
        durationMinutes: result.values.durationMinutes ?? current.durationMinutes,
        pace: result.values.pace ?? current.pace,
      }));
      setOcrStatus('ready');
    } catch (error) {
      setOcrStatus('error');
      setRawText(error.message || 'OCR could not read this screenshot. Enter the values manually.');
    }
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...log,
      distanceKm: Number(log.distanceKm || 0),
      durationMinutes: Number(log.durationMinutes || 0),
      perceivedEffort: Number(log.perceivedEffort),
      fatigueLevel: Number(log.fatigueLevel),
      painLevel: Number(log.painLevel),
    });
  }

  return (
    <section className="panel log-panel">
      <div className="section-heading">
        <div><p className="eyebrow">Workout feedback loop</p><h2>Log completed training</h2></div>
        <span className="source-pill">{log.source === 'SCREENSHOT_OCR' ? 'Screenshot OCR' : 'Manual'}</span>
      </div>

      {session ? <p className="selected-session">Selected: <strong>{session.title}</strong> · {session.targetDistanceKm} km target</p> : <p className="selected-session">Select a planned session from the roadmap first.</p>}

      <div className="ocr-box">
        <label className="upload-drop">
          <span>Upload running screenshot</span>
          <small>OCR runs locally first. Confirm values before the coach sees them.</small>
          <input type="file" accept="image/*" onChange={(event) => analyzeScreenshot(event.target.files?.[0])} />
        </label>
        {ocrStatus === 'reading' && <p className="ocr-note">Reading screenshot... {ocrProgress}%</p>}
        {ocrStatus === 'ready' && <p className="ocr-note success">Extracted likely run details. Please check them before saving.</p>}
        {ocrStatus === 'error' && <p className="ocr-note danger">OCR failed. Manual entry still works.</p>}
      </div>

      <form onSubmit={submit}>
        <div className="form-grid compact">
          <label>Distance km<input type="number" min="0" step="0.01" value={log.distanceKm} onChange={(e) => update('distanceKm', e.target.value)} /></label>
          <label>Duration min<input type="number" min="0" value={log.durationMinutes} onChange={(e) => update('durationMinutes', e.target.value)} /></label>
          <label>Pace<input placeholder="e.g. 6:45" value={log.pace} onChange={(e) => update('pace', e.target.value)} /></label>
          <label>Status<select value={log.completionStatus} onChange={(e) => update('completionStatus', e.target.value)}><option value="COMPLETED">Completed</option><option value="MODIFIED">Modified</option><option value="SKIPPED">Skipped</option></select></label>
          <label>Effort {log.perceivedEffort}<input type="range" min="1" max="10" value={log.perceivedEffort} onChange={(e) => update('perceivedEffort', e.target.value)} /></label>
          <label>Fatigue {log.fatigueLevel}<input type="range" min="1" max="10" value={log.fatigueLevel} onChange={(e) => update('fatigueLevel', e.target.value)} /></label>
          <label>Pain {log.painLevel}<input type="range" min="0" max="10" value={log.painLevel} onChange={(e) => update('painLevel', e.target.value)} /></label>
        </div>
        <label>Training notes<textarea rows="4" value={log.notes} onChange={(e) => update('notes', e.target.value)} placeholder="How did it feel? Any discomfort, fatigue, weather, or route notes?" /></label>
        <button className="primary-button" disabled={!canSubmit}>{isLoading ? 'Asking coach...' : 'Save log and ask coach'}</button>
      </form>

      {rawText && <details className="ocr-raw"><summary>OCR raw text</summary><p>{rawText}</p></details>}
    </section>
  );
}
