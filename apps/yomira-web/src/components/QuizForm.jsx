import { useState } from "react";
import { generateQuiz } from "../api/quizApi";
import AsyncProgress from "./AsyncProgress";
import useBoundedProgress from "./useBoundedProgress";

const generationStages = [
  { until: 15, label: "Starting quiz generation", detail: "Starting quiz generation..." },
  { until: 40, label: "Understanding study content", detail: "Understanding the important ideas in your document..." },
  { until: 70, label: "Writing questions", detail: "Writing unique questions from your document..." },
  { until: 90, label: "Checking question quality", detail: "Checking question quality and repeated questions..." },
  { until: 100, label: "Preparing your quiz", detail: "Preparing your quiz..." }
];

const quizTypeOptions = [
  {
    id: "MULTIPLE_CHOICE",
    label: "Multiple Choice",
    mark: "A/B/C",
    description: "Reflect key ideas into option-based questions."
  },
  {
    id: "TRUE_FALSE",
    label: "True / False",
    mark: "T/F",
    description: "Check whether concepts were understood clearly."
  },
  {
    id: "FLASHCARDS",
    label: "Flashcards",
    mark: "Q/A",
    description: "Turn the reading into compact recall cards."
  }
];

const normalizeQuestion = (question) => question
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

export default function QuizForm({ documentId, documentName, previouslyAskedQuestions, OnGenerated, demoQuiz }) {
  const [quizType, setQuizType] = useState("MULTIPLE_CHOICE");
  const [count, setCount] = useState(5);
  const [phase, setPhase] = useState("configuring");
  const [createdQuiz, setCreatedQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useBoundedProgress(phase === "generating");

  const finishGeneration = (result) => {
    setProgress(100);
    setCreatedQuiz(result);
    setPhase("ready");
  };

  const handleGenerate = async () => {
    if (count < 1 || count > 100) {
      setError("Questions must be between 1 and 100.");
      return;
    }

    if (demoQuiz) {
      setError(null);
      const questions = demoQuiz.questions
        .filter((question) => !previouslyAskedQuestions.has(normalizeQuestion(question.question)))
        .slice(0, count);
      finishGeneration({
        ...demoQuiz,
        questions,
        message: questions.length < count
          ? `Generated ${questions.length} new unique question${questions.length === 1 ? "" : "s"}; the demo sample has no more unseen questions.`
          : null
      });
      return;
    }

    if (phase === "generating") return;
    setProgress(4);
    setPhase("generating");
    setError(null);

    try {
      const result = await generateQuiz({
        documentId,
        quizType,
        questionsCount: count,
        excludedQuestions: Array.from(previouslyAskedQuestions)
      });
      finishGeneration(result);
    } catch (err) {
      setError("Yomira couldn't create this quiz.");
      setPhase("error");
      console.error("Quiz generation error:", err);
    }
  };

  if (phase === "generating") {
    return <AsyncProgress title="Creating your quiz" progress={progress} stages={generationStages} context={documentName} />;
  }

  if (phase === "ready") {
    const questions = createdQuiz.questions || createdQuiz.data || [];
    const typeLabel = quizTypeOptions.find((option) => option.id === quizType)?.label || quizType;
    return (
      <div className="completion-state quiz-created-state" aria-live="polite">
        <AsyncProgress title="Quiz created" progress={100} stages={generationStages} context={documentName} />
        <div className="quiz-summary">
          <strong>{questions.length} question{questions.length === 1 ? " is" : "s are"} ready.</strong>
          <span>{typeLabel}</span>
          <span>{questions.length} question{questions.length === 1 ? "" : "s"}</span>
          <span>Source: {documentName}</span>
        </div>
        <button className="primary-button" type="button" onClick={() => OnGenerated(createdQuiz)}>Start quiz</button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="failure-state" role="alert">
        <span className="eyebrow">Generation stopped</span>
        <h3>{error}</h3>
        <p>Your document and quiz settings are still available.</p>
        <div className="failure-actions">
          <button className="primary-button" type="button" onClick={handleGenerate}>Try again</button>
          <button className="quiet-button" type="button" onClick={() => { setError(null); setPhase("configuring"); }}>Change quiz settings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="quiz-setting-block">
        <label>Reflection format</label>
        <div className="quiz-options">
          {quizTypeOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`option-card ${quizType === option.id ? "selected" : ""}`}
              onClick={() => setQuizType(option.id)}
            >
              <span>{option.mark}</span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-setting-block question-count-block">
        <div className="setting-label-row">
          <label htmlFor="questionCount">Question count</label>
          <strong>{count}</strong>
        </div>
        <input
          id="questionCount"
          className="range-input"
          type="range"
          min="1"
          max="50"
          value={count}
          onChange={(event) => setCount(parseInt(event.target.value, 10))}
        />
        <div className="range-meta"><span>Quick check</span><span>Deep review</span></div>
      </div>

      <button className="primary-button" onClick={handleGenerate}>
        {`Generate ${count} question${count !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
