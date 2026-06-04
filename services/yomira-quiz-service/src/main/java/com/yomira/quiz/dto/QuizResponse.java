package com.yomira.quiz.dto;

import java.util.List;

import com.yomira.quiz.enums.QuizType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizResponse {
    private Long documentId;
    private QuizType quizType;
    private List<Mcq> questions;
}
