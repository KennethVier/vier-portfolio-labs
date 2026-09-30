import { useState } from "react";

export default function QuizResult({ quiz, onGenerateAnother, onChangeDocument }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [view, setView] = useState("quiz");

  if (!quiz) return null;

  const questions = quiz.questions || quiz.data || [];

  if (questions.length === 0) {
    return (
      <div className="result-workflow compact-result">
        <div className="empty-state">
          <strong>No new unique questions available</strong>
          <span>{quiz.message || "Try a different quiz format, or choose another PDF."}</span>
        </div>
        <div className="result-actions result-choice-actions">
          <button className="primary-button" type="button" onClick={onGenerateAnother}>Adjust quiz settings</button>
          <button className="quiet-button" type="button" onClick={onChangeDocument}>Change PDF</button>
        </div>
      </div>
    );
  }

  const score = questions.reduce(
    (total, question, index) => total + (selectedAnswers[index] === question.correctAnswer ? 1 : 0),
    0
  );
  const percentage = Math.round((score / questions.length) * 100);

  if (view === "results") {
    return (
      <div className="result-workflow compact-result">
        <section className="score-panel">
          <span className="eyebrow">Memory reflection</span>
          <strong>{percentage}%</strong>
          <p>{score} correct out of {questions.length}</p>
        </section>
        {quiz.message && <div className="alert generation-note">{quiz.message}</div>}
        <div className="result-actions result-choice-actions">
          <button className="primary-button" type="button" onClick={onGenerateAnother}>Generate another quiz</button>
          <button className="quiet-button" type="button" onClick={() => { setCurrentQuestionIndex(0); setView("review"); }}>Review answers</button>
          <button className="quiet-button" type="button" onClick={onChangeDocument}>Change PDF</button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestionIndex];
  const selectedChoice = selectedAnswers[currentQuestionIndex];
  const isAnswered = Object.prototype.hasOwnProperty.call(selectedAnswers, currentQuestionIndex);
  const isCorrect = selectedChoice === question.correctAnswer;
  const isReviewing = view === "review";
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSelectAnswer = (choiceIndex) => {
    if (!isAnswered && !isReviewing) {
      setSelectedAnswers((answers) => ({ ...answers, [currentQuestionIndex]: choiceIndex }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex === questions.length - 1) {
      setView("results");
      return;
    }
    setCurrentQuestionIndex((index) => index + 1);
  };

  return (
    <div className="result-workflow focused-quiz">
      {quiz.message && <div className="alert generation-note">{quiz.message}</div>}
      <div className="quiz-progress" aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}>
        <div className="question-topline">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          {isAnswered && <strong className={isCorrect ? "answer-correct" : "answer-incorrect"}>{isCorrect ? "Correct" : "Incorrect"}</strong>}
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <article className="question-card focused-question-card">
        <p className="question-text">{question.question}</p>
        <div className="choice-list">
          {(question.choices || []).map((choice, choiceIndex) => {
            const isSelected = selectedChoice === choiceIndex;
            const isCorrectChoice = choiceIndex === question.correctAnswer;
            const showAsCorrect = isAnswered && isCorrectChoice;
            const showAsIncorrect = isAnswered && isSelected && !isCorrect;

            return (
              <button
                type="button"
                key={choiceIndex}
                className={`choice ${isSelected ? "selected" : ""} ${showAsCorrect ? "correct" : ""} ${showAsIncorrect ? "incorrect" : ""}`}
                onClick={() => handleSelectAnswer(choiceIndex)}
                disabled={isAnswered || isReviewing}
              >
                <span className="choice-radio">{String.fromCharCode(65 + choiceIndex)}</span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`answer-reflection ${isCorrect ? "success" : ""}`}>
            <strong>{isCorrect ? "That's right." : "Correct answer"}</strong>
            {!isCorrect && <span>{question.choices?.[question.correctAnswer]}</span>}
            {(question.rationale || question.explanation) && <span>{question.rationale || question.explanation}</span>}
          </div>
        )}
      </article>

      <div className="result-actions question-navigation">
        {isReviewing && currentQuestionIndex > 0 && (
          <button className="quiet-button" type="button" onClick={() => setCurrentQuestionIndex((index) => index - 1)}>Previous</button>
        )}
        {isAnswered && (
          <button className="primary-button" type="button" onClick={handleNext}>
            {currentQuestionIndex === questions.length - 1 ? (isReviewing ? "Back to results" : "See results") : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
