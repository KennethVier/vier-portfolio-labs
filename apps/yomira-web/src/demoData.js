export const BACKEND_DISABLED_MESSAGE = 'Live backend is currently disabled for this portfolio demo. Contact the admin to enable this workflow.';

export const demoQuiz = {
  documentId: 0,
  quizType: 'MULTIPLE_CHOICE',
  questions: [
    { question: 'What is the main purpose of Yomira?', choices: ['To store passwords', 'To turn reading material into reflective study questions', 'To sell products', 'To track employee attendance'], correctAnswer: 1 },
    { question: 'Why is the sample quiz labeled as demo data?', choices: ['The PDF parser is disabled permanently', 'The live backend may be offline on free-tier deployment', 'The app has no frontend', 'The answers are randomized'], correctAnswer: 1 },
    { question: 'What should a visitor do to enable real upload and AI generation?', choices: ['Refresh forever', 'Contact the admin to enable the backend workflow', 'Delete the browser cache', 'Use fake credentials'], correctAnswer: 1 }
  ]
};
