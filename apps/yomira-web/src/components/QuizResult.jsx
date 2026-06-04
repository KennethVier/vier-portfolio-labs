import { useState } from "react";

export default function QuizResult({ quiz }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) return null;

  const questions = quiz.questions || quiz.data || [];

  if (!questions || questions.length === 0) {
    return (
      <div className="empty-state">
        <strong>No questions generated</strong>
        <span>Try another document or reduce the question count.</span>
      </div>
    );
  }

  const handleSelectAnswer = (questionIndex, choiceIndex) => {
    if (!submitted) {
      setSelectedAnswers({ ...selectedAnswers, [questionIndex]: choiceIndex });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const score = questions.reduce((total, question, index) => total + (selectedAnswers[index] === question.correctAnswer ? 1 : 0), 0);
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="result-workflow">
      {submitted && (
        <section className="score-panel">
          <span className="eyebrow">Memory reflection</span>
          <strong>{percentage}%</strong>
          <p>{score} of {questions.length} answers matched the reflected source.</p>
        </section>
      )}

      <div className="quiz-container">
        {questions.map((question, questionIndex) => {
          const selectedChoice = selectedAnswers[questionIndex];
          const isAnswered = Object.prototype.hasOwnProperty.call(selectedAnswers, questionIndex);
          const isCorrect = selectedChoice === question.correctAnswer;
          const showFeedback = submitted && isAnswered;

          return (
            <article key={questionIndex} className="question-card">
              <div className="question-topline">
                <span>Question {questionIndex + 1}</span>
                {showFeedback && <strong className={isCorrect ? "answer-correct" : "answer-incorrect"}>{isCorrect ? "Correct" : "Review"}</strong>}
              </div>

              <p className="question-text">{question.question}</p>

              <div className="choice-list">
                {question.choices && question.choices.map((choice, choiceIndex) => {
                  const isSelected = selectedChoice === choiceIndex;
                  const isCorrectChoice = choiceIndex === question.correctAnswer;
                  const showAsCorrect = submitted && isCorrectChoice;
                  const showAsIncorrect = submitted && isSelected && !isCorrect;

                  return (
                    <button
                      type="button"
                      key={choiceIndex}
                      className={`choice ${isSelected ? "selected" : ""} ${showAsCorrect ? "correct" : ""} ${showAsIncorrect ? "incorrect" : ""}`}
                      onClick={() => handleSelectAnswer(questionIndex, choiceIndex)}
                      disabled={submitted}
                    >
                      <span className="choice-radio">{String.fromCharCode(65 + choiceIndex)}</span>
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>

              {showFeedback && !isCorrect && (
                <div className="answer-reflection">
                  <strong>Reflected answer</strong>
                  <span>{question.choices[question.correctAnswer]}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="result-actions">
        {!submitted ? (
          <button className="primary-button" onClick={() => setSubmitted(true)} disabled={Object.keys(selectedAnswers).length !== questions.length}>
            Submit reflection
          </button>
        ) : (
          <button className="quiet-button" onClick={handleReset}>Review again</button>
        )}
      </div>

      {!submitted && (
        <p className="answered-count">Answered {Object.keys(selectedAnswers).length} of {questions.length}</p>
      )}
    </div>
  );
}
