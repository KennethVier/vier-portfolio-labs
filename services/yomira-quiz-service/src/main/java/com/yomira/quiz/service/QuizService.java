package com.yomira.quiz.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

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

        Set<String> fingerprints = new HashSet<>();
        if (request.getExcludedQuestions() != null) {
            request.getExcludedQuestions().stream()
                    .map(this::normalizeQuestion)
                    .filter(fingerprint -> !fingerprint.isBlank())
                    .forEach(fingerprints::add);
        }

        List<Mcq> questions = new ArrayList<>();
        List<String> promptExclusions = new ArrayList<>(request.getExcludedQuestions() == null
                ? List.of()
                : request.getExcludedQuestions());
        int tries = 0;
        while (questions.size() < request.getQuestionsCount() && tries < 4) {
            int questionsNeeded = request.getQuestionsCount() - questions.size();
            String prompt = quizPrompts.buildPrompt(request.getQuizType(), questionsNeeded, doc.getText(), promptExclusions);
            try {
                String aiResult = ollamaCloudService.generate(new OllamaRequest("gpt-oss:120b-cloud", prompt, 0.3, 500, false));
                log.info("AI response received (length={} chars)", aiResult.length());
                for (Mcq candidate : quizParser.parse(aiResult)) {
                    String fingerprint = normalizeQuestion(candidate.getQuestion());
                    if (!fingerprint.isBlank() && fingerprints.add(fingerprint)) {
                        questions.add(candidate);
                        promptExclusions.add(candidate.getQuestion());
                    }
                    if (questions.size() == request.getQuestionsCount()) break;
                }
            } catch (Exception e) {
                log.error("Failed to generate quiz via AI for document ID {}: {}", request.getDocumentId(), e.getMessage());
                throw new RuntimeException("Failed to generate content", e);
            }
            tries++;
        }
        log.info("Parsed {} questions from AI output", questions.size());

        String message = questions.size() < request.getQuestionsCount()
                ? "Generated " + questions.size() + " unique questions out of " + request.getQuestionsCount()
                    + "; no additional unseen questions could be produced."
                : null;

        // Return response
        return QuizResponse.builder()
                .documentId(request.getDocumentId())
                .quizType(request.getQuizType())
                .questions(questions)
                .message(message)
                .build();
    }

    private String normalizeQuestion(String question) {
        if (question == null) return "";
        return Normalizer.normalize(question, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim();
    }
}
