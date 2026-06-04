import { useMemo, useState } from "react";
import UploadPdf from "./components/UploadPdf";
import QuizForm from "./components/QuizForm";
import QuizResult from "./components/QuizResult";

const steps = [
  { key: "read", label: "Read", detail: "Upload source material" },
  { key: "reflect", label: "Reflect", detail: "Choose how to study" },
  { key: "remember", label: "Remember", detail: "Practice with questions" }
];

export default function App() {
  const [documentId, setDocumentId] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const currentStep = useMemo(() => {
    if (quiz) return "remember";
    if (documentId) return "reflect";
    return "read";
  }, [documentId, quiz]);

  const handleReset = () => {
    setDocumentId(null);
    setDocumentName(null);
    setQuiz(null);
  };

  return (
    <div className="app-wrapper">
      <header className="top-shell">
        <div className="brand-lockup">
          <img src="/images/vier-yomira-mark.png" alt="Yomira mark" />
          <div>
            <strong>Yomira</strong>
            <span>Read and reflect from your documents</span>
          </div>
        </div>
        <div className="brand-story">
          <span>Yomu + Mirror</span>
          <p>Read. Reflect. Remember.</p>
        </div>
      </header>

      <main className="workspace">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Reading mirror workspace</span>
            <h1>Turn dense PDFs into questions you can actually remember.</h1>
            <p>
              Yomira reads your document, reflects the important ideas back into a study flow, then helps you practice through generated quizzes.
            </p>
          </div>
          <div className="step-strip" aria-label="Yomira workflow steps">
            {steps.map((step, index) => (
              <div className={`step-item ${currentStep === step.key ? "active" : ""}`} key={step.key}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {!documentId ? (
          <section className="mirror-grid">
            <div className="surface-panel read-panel">
              <span className="eyebrow">Step 01 / Read</span>
              <h2>Bring in the source</h2>
              <p>Upload a PDF and let Yomira prepare it for reflection. Keep the source close, because the best study flow starts with context.</p>
              <UploadPdf
                onUploaded={(id, name) => {
                  setDocumentId(id);
                  setDocumentName(name);
                }}
              />
            </div>
            <aside className="surface-panel reflection-panel">
              <span className="eyebrow">Reflection lens</span>
              <h2>What Yomira is built for</h2>
              <div className="reflection-list">
                <article><strong>Read</strong><span>Capture the uploaded document as the source of truth.</span></article>
                <article><strong>Reflect</strong><span>Convert important ideas into focused quiz settings.</span></article>
                <article><strong>Remember</strong><span>Practice with generated questions and immediate feedback.</span></article>
              </div>
            </aside>
          </section>
        ) : !quiz ? (
          <section className="mirror-grid">
            <div className="surface-panel read-panel compact-source">
              <span className="eyebrow">Source locked</span>
              <h2>{documentName}</h2>
              <p>Your reading material is ready. Now choose how Yomira should reflect it back for study.</p>
              <button className="quiet-button" type="button" onClick={handleReset}>Choose another PDF</button>
            </div>
            <div className="surface-panel reflection-panel">
              <span className="eyebrow">Step 02 / Reflect</span>
              <h2>Shape the study mirror</h2>
              <p>Pick the quiz format and question count that match the way you want to remember this material.</p>
              <QuizForm documentId={documentId} OnGenerated={setQuiz} />
            </div>
          </section>
        ) : (
          <section className="surface-panel result-panel">
            <div className="result-header">
              <div>
                <span className="eyebrow">Step 03 / Remember</span>
                <h2>Your reflected quiz</h2>
                <p>Use the questions as a memory check, then review what the document reflected back.</p>
              </div>
              <button className="quiet-button" type="button" onClick={handleReset}>Start over</button>
            </div>
            <QuizResult quiz={quiz} />
          </section>
        )}
      </main>
    </div>
  );
}
