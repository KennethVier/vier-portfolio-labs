import { useState } from "react";
import { generateQuiz } from "../api/quizApi";

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

export default function QuizForm({ documentId, OnGenerated }) {
  const [quizType, setQuizType] = useState("MULTIPLE_CHOICE");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (count < 1 || count > 100) {
      setError("Questions must be between 1 and 100.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateQuiz({ documentId, quizType, questionsCount: count });
      OnGenerated(result);
    } catch (err) {
      setError("Failed to generate quiz. Please make sure the quiz service is running.");
      console.error("Quiz generation error:", err);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="quiz-setting-block">
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

      <button className="primary-button" onClick={handleGenerate} disabled={loading}>
        {loading ? "Reflecting into questions..." : `Generate ${count} question${count !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
