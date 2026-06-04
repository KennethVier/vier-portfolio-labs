package com.yomira.quiz.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Mcq {
    private String question;
    private List<String> choices;
    private int correctAnswer;
}
