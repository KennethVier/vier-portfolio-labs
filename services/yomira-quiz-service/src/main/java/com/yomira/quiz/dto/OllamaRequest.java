package com.yomira.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OllamaRequest {

    private String model;
    private String prompt;
    private Double temperature;
    private Integer max_tokens;
    private boolean stream;

}
