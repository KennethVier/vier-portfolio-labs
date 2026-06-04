package com.yomira.quiz.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yomira.quiz.dto.Mcq;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class QuizParser {

    @Autowired
    ObjectMapper objectMapper;

    public List<Mcq> parse(String aiResponse) {
        List<Mcq> questions = new ArrayList<>();

        try {
            // Try simple pipe-delimited format first (fastest)
            questions = parsePipeFormat(aiResponse);
            if (!questions.isEmpty()) {
                log.info("✓ Parsed {} questions using pipe format", questions.size());
                return questions;
            }

            // Fallback: text format
            questions = parseTextFormat(aiResponse);
            if (!questions.isEmpty()) {
                log.info("✓ Parsed {} questions using text format", questions.size());
                return questions;
            }

            // Last resort: JSON format
            questions = parseJsonFormat(aiResponse);
            if (!questions.isEmpty()) {
                log.info("✓ Parsed {} questions using JSON format", questions.size());
                return questions;
            }

            log.warn("✗ No questions parsed. Response: {}", aiResponse.substring(0, Math.min(200, aiResponse.length())));

        } catch (Exception e) {
            log.error("✗ Parse error: ", e);
        }

        return questions;
    }

    /**
     * Parse pipe-delimited format (both single-line and multi-line):
     * MCQ: Q1: text|A) choice1|B) choice2|C) choice3|D) choice4|ANS: A
     * TRUE/FALSE: Q1: statement?|ANS: TRUE or FALSE
     * FLASHCARD: F1: FRONT: term|BACK: definition
     * Multi-line formats also supported
     */
    private List<Mcq> parsePipeFormat(String aiResponse) {
        List<Mcq> questions = new ArrayList<>();

        try {
            String[] lines = aiResponse.split("\n");
            int i = 0;
            
            while (i < lines.length) {
                String line = lines[i].trim();
                
                // Start of a question (Q1:, Q2:, etc. or Q:)
                if (line.matches("^Q\\d*:.*") || line.startsWith("Q:")) {
                    try {
                        // Check if this is single-line pipe format (contains pipes)
                        if (line.contains("|")) {
                            // Detect format by counting pipes
                            String[] parts = line.split("\\|");
                            
                            // TRUE/FALSE format: only 2 parts (Q | ANS)
                            if (parts.length == 2 && parts[1].matches("(?i)ANS\\s*:\\s*(TRUE|FALSE).*")) {
                                Mcq mcq = parseSingleLineTrueFalseFormat(line);
                                if (mcq != null) {
                                    questions.add(mcq);
                                }
                                i++;
                            }
                            // MCQ format: 6+ parts (Q | A | B | C | D | ANS)
                            else if (parts.length >= 6) {
                                Mcq mcq = parseSingleLinePipeFormat(line);
                                if (mcq != null) {
                                    questions.add(mcq);
                                }
                                i++;
                            } else {
                                i++;
                            }
                        } else {
                            // Multi-line format
                            String question = line.replaceAll("^Q:\\s*", "").trim();
                            List<String> choices = new ArrayList<>();
                            int correctIdx = -1;
                            i++;
                            
                            // Collect following pipe-delimited lines
                            while (i < lines.length) {
                                String nextLine = lines[i].trim();
                                
                                if (nextLine.isEmpty()) {
                                    i++;
                                    continue;
                                }
                                
                                // Check for answer line
                                if (nextLine.matches("(?i)ANS\\s*:\\s*[A-D]\\)?")) {
                                    String ansStr = nextLine.replaceAll("(?i)ANS\\s*:\\s*", "").replaceAll("\\).*", "").trim();
                                    if (ansStr.matches("[A-D]")) {
                                        correctIdx = ansStr.charAt(0) - 'A';
                                    }
                                    i++;
                                    break;
                                }
                                
                                // Check for pipe-delimited choice
                                if (nextLine.startsWith("|") || nextLine.matches("^[A-D]\\).*")) {
                                    String choice = nextLine.replaceAll("^\\|\\s*", "").replaceAll("^[A-D]\\)\\s*", "").trim();
                                    if (!choice.isEmpty()) {
                                        choices.add(choice);
                                    }
                                    i++;
                                } else if (nextLine.startsWith("Q:")) {
                                    // Next question started
                                    break;
                                } else {
                                    i++;
                                }
                            }
                            
                            // Validate and add question
                            if (question != null && !question.isEmpty() && !choices.isEmpty() && correctIdx >= 0) {
                                // Ensure we have exactly 4 choices
                                while (choices.size() < 4) {
                                    choices.add("(Missing option)");
                                }
                                if (choices.size() > 4) {
                                    choices = new ArrayList<>(choices.subList(0, 4));
                                }
                                
                                questions.add(Mcq.builder()
                                        .question(question)
                                        .choices(choices)
                                        .correctAnswer(Math.min(correctIdx, 3))
                                        .build());
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Pipe parse error on line: {}", line);
                        i++;
                    }
                } else {
                    i++;
                }
            }
        } catch (Exception e) {
            log.debug("Pipe format failed");
        }

        return questions;
    }

    /**
     * Parse single-line pipe format: Q1: text|A) choice1|B) choice2|C) choice3|D) choice4|ANS: A
     * Also handles Q: without number
     */
    private Mcq parseSingleLinePipeFormat(String line) {
        try {
            String[] parts = line.split("\\|");
            if (parts.length < 6) return null; // Need Q + 4 choices + ANS
            
            String question = parts[0].replaceAll("^Q\\d*:\\s*", "").trim();
            List<String> choices = new ArrayList<>();
            int correctIdx = -1;
            
            // Extract choices (parts 1-4)
            for (int i = 1; i <= 4 && i < parts.length; i++) {
                String choice = parts[i].replaceAll("^[A-D]\\)\\s*", "").trim();
                if (!choice.isEmpty()) {
                    choices.add(choice);
                }
            }
            
            // Extract answer from last part
            if (parts.length > 5) {
                String ansStr = parts[5].replaceAll("(?i)ANS\\s*:\\s*", "").replaceAll("\\).*", "").trim();
                if (!ansStr.isEmpty() && ansStr.matches("[A-D]")) {
                    correctIdx = ansStr.charAt(0) - 'A';
                }
            }
            
            // Validate
            if (question != null && !question.isEmpty() && choices.size() >= 4 && correctIdx >= 0) {
                // Keep only first 4 choices
                if (choices.size() > 4) {
                    choices = new ArrayList<>(choices.subList(0, 4));
                }
                
                return Mcq.builder()
                        .question(question)
                        .choices(choices)
                        .correctAnswer(correctIdx)
                        .build();
            }
        } catch (Exception e) {
            log.debug("Single-line pipe parse error: {}", line);
        }
        
        return null;
    }

    /**
     * Parse single-line TRUE/FALSE format: Q1: statement?|ANS: TRUE or FALSE
     * Also handles Q: without number
     * Converts to Mcq with 2 choices: [FALSE, TRUE] where correctAnswer is 0 or 1
     */
    private Mcq parseSingleLineTrueFalseFormat(String line) {
        try {
            String[] parts = line.split("\\|");
            if (parts.length < 2) return null;

            String statement = parts[0].replaceAll("^Q\\d*:\\s*", "").trim();
            String answerPart = parts[1].replaceAll("(?i)ANS\\s*:\\s*", "").trim();
            
            // Extract TRUE or FALSE
            Pattern answerPattern = Pattern.compile("(TRUE|FALSE)", Pattern.CASE_INSENSITIVE);
            Matcher answerMatcher = answerPattern.matcher(answerPart);
            
            if (answerMatcher.find() && !statement.isEmpty()) {
                String answer = answerMatcher.group(1).toUpperCase();
                int correctIdx = answer.equals("TRUE") ? 1 : 0;
                
                return Mcq.builder()
                        .question(statement)
                        .choices(List.of("FALSE", "TRUE"))
                        .correctAnswer(correctIdx)
                        .build();
            }
        } catch (Exception e) {
            log.debug("Single-line TRUE/FALSE parse error: {}", line);
        }
        
        return null;
    }

    /**
     * Parse text format: Question 1:, Question 2:, etc.
     */
    private List<Mcq> parseTextFormat(String aiResponse) {
        List<Mcq> questions = new ArrayList<>();

        try {
            // Split by "Question X:" pattern to separate each question
            Pattern questionPattern = Pattern.compile("Question\\s+\\d+:\\s*(.+?)(?=Question\\s+\\d+:|$)", Pattern.DOTALL);
            Matcher questionMatcher = questionPattern.matcher(aiResponse);

            while (questionMatcher.find()) {
                String questionBlock = questionMatcher.group(1).trim();

                try {
                    Mcq mcq = parseQuestionBlock(questionBlock);
                    if (mcq != null) {
                        questions.add(mcq);
                    }
                } catch (Exception e) {
                    log.debug("Error parsing question block: {}", questionBlock, e);
                }
            }

        } catch (Exception e) {
            log.debug("Text format parsing failed: ", e);
        }

        return questions;
    }

    /**
     * Parse JSON format (handles both well-formed and malformed JSON from LLMs)
     */
    private List<Mcq> parseJsonFormat(String aiResponse) {
        List<Mcq> questions = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(aiResponse);
            JsonNode questionsNode = root.get("questions");

            if (questionsNode != null && questionsNode.isArray()) {
                for (JsonNode qNode : questionsNode) {
                    try {
                        Mcq mcq = parseJsonQuestion(qNode);
                        if (mcq != null) {
                            questions.add(mcq);
                        }
                    } catch (Exception e) {
                        log.debug("Error parsing JSON question: {}", qNode, e);
                    }
                }
            }

        } catch (Exception e) {
            log.debug("JSON format parsing failed: ", e);
        }

        return questions;
    }

    /**
     * Parse a single JSON question node
     */
    private Mcq parseJsonQuestion(JsonNode qNode) {
        try {
            String question = null;
            List<String> choices = new ArrayList<>();
            int correctAnswerIndex = -1;

            // Extract question text
            if (qNode.has("question")) {
                question = qNode.get("question").asText().trim();
            } else {
                return null;
            }

            // Try to find choices and correct answer from the malformed JSON
            // The LLM puts them as keys, so we need to search through field names
            String answerKey = null;
            var fieldNamesIterator = qNode.fieldNames();
            while (fieldNamesIterator.hasNext()) {
                String fieldName = fieldNamesIterator.next();
                if (!fieldName.equals("question")) {
                    answerKey = fieldName;
                    break;
                }
            }

            if (answerKey != null) {
                // Parse choices and correct answer from the key
                choices = extractChoicesFromText(answerKey);
                correctAnswerIndex = extractCorrectAnswerFromText(answerKey);
            }

            // Validate
            if (question != null && !choices.isEmpty() && correctAnswerIndex >= 0) {
                if (choices.size() < 4) {
                    log.debug("Question has {} choices instead of 4", choices.size());
                }

                return Mcq.builder()
                        .question(question)
                        .choices(choices)
                        .correctAnswer(Math.min(correctAnswerIndex, choices.size() - 1))
                        .build();
            }

        } catch (Exception e) {
            log.debug("Error parsing JSON question: ", e);
        }

        return null;
    }

    /**
     * Extract multiple choice options from text like "A) Option1 B) Option2 C) Option3 D) Option4"
     */
    private List<String> extractChoicesFromText(String text) {
        List<String> choices = new ArrayList<>();

        try {
            // Pattern to find A), B), C), D) followed by text
            Pattern choicePattern = Pattern.compile("[A-D]\\)\\s*([^A-D)]*?)(?=[A-D]\\)|Correct\\s+answer|$)", Pattern.CASE_INSENSITIVE);
            Matcher choiceMatcher = choicePattern.matcher(text);

            while (choiceMatcher.find()) {
                String choice = choiceMatcher.group(1).trim();
                if (!choice.isEmpty()) {
                    choices.add(choice);
                }
            }
        } catch (Exception e) {
            log.debug("Error extracting choices from text: {}", text, e);
        }

        return choices;
    }

    /**
     * Extract the correct answer letter (A, B, C, or D) from text
     */
    private int extractCorrectAnswerFromText(String text) {
        try {
            // Look for "Correct answer: X)" pattern
            Pattern correctPattern = Pattern.compile("Correct\\s+answer\\s*:?\\s*([A-D])", Pattern.CASE_INSENSITIVE);
            Matcher correctMatcher = correctPattern.matcher(text);

            if (correctMatcher.find()) {
                String correctLetter = correctMatcher.group(1).toUpperCase();
                return correctLetter.charAt(0) - 'A'; // Convert A->0, B->1, C->2, D->3
            }
        } catch (Exception e) {
            log.debug("Error extracting correct answer: {}", text, e);
        }

        return -1;
    }

    /**
     * Parse a single question block in text format
     */
    private Mcq parseQuestionBlock(String block) {
        try {
            String[] lines = block.split("\n");
            String question = null;
            List<String> choices = new ArrayList<>();
            int correctAnswerIndex = -1;

            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;

                // First non-empty line is the question
                if (question == null) {
                    question = line;
                    continue;
                }

                // Match choice lines: A) choice, B) choice, etc.
                Pattern choicePattern = Pattern.compile("^([A-D])\\)\\s*(.+)$");
                Matcher choiceMatcher = choicePattern.matcher(line);
                if (choiceMatcher.find()) {
                    String letter = choiceMatcher.group(1);
                    String choiceText = choiceMatcher.group(2);
                    choices.add(choiceText);
                    continue;
                }

                // Match correct answer line
                Pattern correctPattern = Pattern.compile("(?i)correct\\s*(?:answer)?\\s*:?\\s*([A-D])", Pattern.CASE_INSENSITIVE);
                Matcher correctMatcher = correctPattern.matcher(line);
                if (correctMatcher.find()) {
                    String correctLetter = correctMatcher.group(1).toUpperCase();
                    correctAnswerIndex = correctLetter.charAt(0) - 'A'; // Convert A->0, B->1, C->2, D->3
                    continue;
                }
            }

            // Validate and build MCQ
            if (question != null && !choices.isEmpty() && correctAnswerIndex >= 0 && correctAnswerIndex < 4) {
                if (choices.size() != 4) {
                    log.debug("Question has {} choices instead of 4: {}", choices.size(), question);
                }

                return Mcq.builder()
                        .question(question)
                        .choices(choices)
                        .correctAnswer(correctAnswerIndex)
                        .build();
            }

        } catch (Exception e) {
            log.debug("Error in parseQuestionBlock: ", e);
        }

        return null;
    }

    /**
     * Parse TRUE/FALSE format: Q: statement?|ANS: TRUE or FALSE
     * Extracts answer and explanation: statement|answer|explanation
     * Example: "The ER is responsible...|TRUE" or "Peroxisomes found...|FALSE|Peroxisomes are also found in plant cells"
     */
    public List<String> parseTrueFalse(String aiResponse) {
        List<String> results = new ArrayList<>();

        try {
            String[] lines = aiResponse.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || !line.startsWith("Q:")) continue;

                try {
                    String[] parts = line.split("\\|");
                    if (parts.length < 2) continue;

                    String statement = parts[0].replaceAll("^Q:\\s*", "").trim();
                    String answerPart = parts[1].replaceAll("(?i)ANS\\s*:\\s*", "").trim();
                    
                    // Extract TRUE or FALSE
                    Pattern answerPattern = Pattern.compile("(TRUE|FALSE)", Pattern.CASE_INSENSITIVE);
                    Matcher answerMatcher = answerPattern.matcher(answerPart);
                    
                    if (answerMatcher.find() && !statement.isEmpty()) {
                        String answer = answerMatcher.group(1).toUpperCase();
                        
                        // Extract explanation if it exists (text in parentheses)
                        String explanation = "";
                        Pattern explanationPattern = Pattern.compile("\\(([^)]+)\\)");
                        Matcher explanationMatcher = explanationPattern.matcher(answerPart);
                        if (explanationMatcher.find()) {
                            explanation = explanationMatcher.group(1).trim();
                        }
                        
                        // Format: "statement|answer" or "statement|answer|explanation"
                        if (explanation.isEmpty()) {
                            results.add(statement + "|" + answer);
                        } else {
                            results.add(statement + "|" + answer + "|" + explanation);
                        }
                    }
                } catch (Exception e) {
                    log.debug("TRUE/FALSE parse error on line: {}", line);
                }
            }
        } catch (Exception e) {
            log.debug("TRUE/FALSE format parsing failed: ", e);
        }

        return results;
    }

    /**
     * Parse FLASHCARD format: FRONT: term|BACK: definition
     */
    public List<String> parseFlashcards(String aiResponse) {
        List<String> results = new ArrayList<>();

        try {
            String[] lines = aiResponse.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || !line.startsWith("FRONT:")) continue;

                try {
                    String[] parts = line.split("\\|");
                    if (parts.length < 2) continue;

                    String front = parts[0].replaceAll("^FRONT:\\s*", "").trim();
                    String back = parts[1].replaceAll("^BACK:\\s*", "").trim();

                    if (!front.isEmpty() && !back.isEmpty()) {
                        // Format: "front|back"
                        results.add(front + "|" + back);
                    }
                } catch (Exception e) {
                    log.debug("FLASHCARD parse error on line: {}", line);
                }
            }
        } catch (Exception e) {
            log.debug("FLASHCARD format parsing failed: ", e);
        }

        return results;
    }
}
