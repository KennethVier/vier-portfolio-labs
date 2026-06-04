package com.yomira.quiz.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yomira.quiz.dto.QuizRequest;
import com.yomira.quiz.dto.QuizResponse;
import com.yomira.quiz.service.QuizService;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    
    @Autowired
    QuizService quizService;

    @PostMapping("/generate")
    public ResponseEntity<QuizResponse> generateQuiz(@RequestBody QuizRequest quizRequest){
        
        QuizResponse response = quizService.generateQuiz(quizRequest);

        return ResponseEntity.ok(response);
    }
}
