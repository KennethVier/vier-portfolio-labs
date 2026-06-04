package com.yomira.quiz.dto;

import com.yomira.quiz.enums.QuizType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizRequest {

    private Long documentId;
    private QuizType quizType;
    private int questionsCount;

}
