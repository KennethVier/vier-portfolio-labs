package com.yomira.quiz.service;

import org.springframework.stereotype.Component;

import com.yomira.quiz.enums.QuizType;

@Component
public class QuizPrompts {

    public String buildPrompt(
        QuizType quizType,
        int count,
        String documentText
    ) {
        return switch(quizType) {
            case MULTIPLE_CHOICE -> mcqPrompt(count, documentText);
            case TRUE_FALSE -> trueFalsePrompt(count, documentText);
            case FLASHCARDS -> flashcardPrompt(count, documentText);
        };
    }

    public String mcqPrompt(int count, String documentText){
        String multipleChoicePrompt = """
            Generate %d multiple choice questions ONLY. Not more, not less. Exactly %d.
            
            Text:
            %s
            
            Format (one per line):
            Q: question?|A) choice1|B) choice2|C) choice3|D) choice4|ANS: A
            
            Rules:
            - Generate exactly %d questions
            - STOP after %d questions - do not generate more
            - One question per line
            - 4 choices per question
            - ANS: is a single letter (A/B/C/D)
            - No extra text, explanations, preamble or summary
            """.formatted(count, count, documentText, count, count);

        return multipleChoicePrompt;
    }

    public String trueFalsePrompt(int count, String documentText){
        String trueOrFalsePrompt = """
            Generate %d TRUE/FALSE questions ONLY. Not more, not less. Exactly %d.
            
            Text:
            %s
            
            Format (one per line):
            Q: statement?|ANS: TRUE
            
            Rules:
            - Generate exactly %d questions
            - STOP after %d questions - do not generate more
            - One question per line
            - Answer is TRUE or FALSE only
            - No extra text, explanations, preamble or summary
            """.formatted(count, count, documentText, count, count);

        return trueOrFalsePrompt;
    }

    public String flashcardPrompt(int count, String documentText){
        String flashCardsPrompt = """
            Generate %d flashcards ONLY. Not more, not less. Exactly %d.
            
            Text:
            %s
            
            Format (one per line):
            FRONT: term|BACK: definition
            
            Rules:
            - Generate exactly %d flashcards
            - STOP after %d flashcards - do not generate more
            - One flashcard per line
            - Keep answers concise
            - No extra text, explanations, preamble or summary
            """.formatted(count, count, documentText, count, count);

        return flashCardsPrompt;
    }
}
