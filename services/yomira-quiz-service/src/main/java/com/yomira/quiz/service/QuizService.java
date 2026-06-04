package com.yomira.quiz.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.yomira.quiz.dto.DocumentTextResponse;
import com.yomira.quiz.dto.Mcq;
import com.yomira.quiz.dto.OllamaRequest;
import com.yomira.quiz.dto.QuizRequest;
import com.yomira.quiz.dto.QuizResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    @Autowired
    QuizPrompts quizPrompts;

    @Autowired
    @Qualifier("documentServClient")
    WebClient documentServClient;

    @Autowired
    QuizParser quizParser;

    @Autowired
    OllamaCloudService ollamaCloudService;

    public QuizResponse generateQuiz(QuizRequest request) {
        log.info("Generating quiz for document ID: {}", request.getDocumentId());

        // Fetch document text
        DocumentTextResponse doc = documentServClient.get()
                .uri("/{id}/text", request.getDocumentId())
                .retrieve()
                .bodyToMono(DocumentTextResponse.class)
                .block();

        if (doc == null || doc.getText() == null || doc.getText().isBlank()) {
            log.warn("Document text is empty for ID {}", request.getDocumentId());
            throw new RuntimeException("Document has no text to generate quiz.");
        }

        log.info("Fetched document text (length={} chars)", doc.getText().length());

        // Build AI prompt
        String prompt = quizPrompts.buildPrompt(request.getQuizType(),
                                                request.getQuestionsCount(),
                                                doc.getText());
        String aiResult;
        try {
            OllamaRequest ollamaRequest = new OllamaRequest("gpt-oss:120b-cloud", prompt, 0.3, 500, false);

            aiResult = ollamaCloudService.generate(ollamaRequest);
            log.info("AI response received (length={} chars)", aiResult.length());

        } catch (Exception e) {
            log.error("Failed to generate quiz via AI for document ID {}: {}", request.getDocumentId(), e.getMessage());
            throw new RuntimeException("Failed to generate content", e);
        }
            log.info("AI RAW RESPONSE: \n{}", aiResult);
        // Parse AI output
        List<Mcq> questions = quizParser.parse(aiResult);
        int tries = 0;
        while (questions.size() < request.getQuestionsCount()) {
            int questionsNeeded = request.getQuestionsCount() - questions.size();
            log.info("Only parsed {} questions, need {} more. Requesting additional questions from AI.",
                     questions.size(), questionsNeeded);
            String followUpPrompt = quizPrompts.buildPrompt(request.getQuizType(),
                                                            questionsNeeded,
                                                            doc.getText());
            String followUpResult = ollamaCloudService.generate(new OllamaRequest("gpt-oss:120b-cloud", followUpPrompt, 0.3, 500, false));
            questions.addAll(quizParser.parse(followUpResult));
            tries++;
            if (tries >= 3) {
                log.warn("Reached maximum follow-up attempts to get questions from AI.");
                break;
            }
        }
        log.info("Parsed {} questions from AI output", questions.size());

        if (questions.size() > request.getQuestionsCount()) {
            questions = questions.subList(0, request.getQuestionsCount());
        }

        // Return response
        return QuizResponse.builder()
                .documentId(request.getDocumentId())
                .quizType(request.getQuizType())
                .questions(questions)
                .build();
    }
}
