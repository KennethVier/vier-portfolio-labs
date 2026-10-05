package com.vier.pesopilot.ai.dto;

import com.vier.pesopilot.ai.dto.context.AiPromptContextDto;
import com.vier.pesopilot.ai.dto.context.ClarificationStateDto;
import com.vier.pesopilot.ai.dto.context.ConversationContextDto;
import com.vier.pesopilot.ai.dto.context.FinancialSummaryDto;
import com.vier.pesopilot.ai.dto.context.HealthInsightDto;
import com.vier.pesopilot.ai.dto.context.IncomeInsightDto;
import com.vier.pesopilot.ai.dto.context.InsightsDto;
import com.vier.pesopilot.ai.dto.context.MemoryContextDto;
import com.vier.pesopilot.ai.dto.context.MemoryItemDto;
import com.vier.pesopilot.ai.dto.context.RecentMessageDto;
import com.vier.pesopilot.ai.dto.context.RecommendationItemDto;
import com.vier.pesopilot.ai.dto.context.SummaryMetadataDto;
import com.vier.pesopilot.ai.dto.context.SummaryParagraphDto;
import com.vier.pesopilot.ai.dto.context.SummarySectionDto;
import com.vier.pesopilot.ai.dto.context.TopicStateDto;
import com.vier.pesopilot.ai.exception.AiValidationException;
import com.vier.pesopilot.ai.validation.AiRequestContractValidator;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiExplanationRequestValidationTest {

    private Validator validator;
    private AiRequestContractValidator contractValidator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        contractValidator = new AiRequestContractValidator();
    }

    private AiPromptContextDto createValidContext() {
        SummaryMetadataDto metadata = new SummaryMetadataDto(
                "sum-1", "cutoff", "1.0.0", "1.0.0", "1.0.0", "en"
        );
        SummaryParagraphDto paragraph = new SummaryParagraphDto(
                "p1", "Savings on track.", "month", List.of("health"), List.of("rec-1")
        );
        SummarySectionDto section = new SummarySectionDto(
                "overview", "Overview", List.of(paragraph)
        );
        FinancialSummaryDto financialSummary = new FinancialSummaryDto(
                "1.0.0", "monthly", "2026-10-05T00:00:00Z", metadata, "active", List.of(section)
        );

        RecommendationItemDto recommendation = new RecommendationItemDto(
                "rec-1", "savings", "increase_emergency_fund", "Build Emergency Fund",
                "Increase your savings rate.", "medium", 1, 1,
                List.of("savingsRate=25%"), List.of("rule-1")
        );

        InsightsDto insights = new InsightsDto(
                new HealthInsightDto(85, "healthy"),
                null, null, null, null, null, null
        );

        return new AiPromptContextDto(
                "1.0.0", "monthly", null,
                financialSummary,
                List.of(recommendation),
                insights,
                null, null
        );
    }

    @Test
    void validCanonicalContextPassesJakartaAndContractValidation() {
        AiPromptContextDto context = createValidContext();
        AiExplanationRequest request = new AiExplanationRequest(context);

        Set<ConstraintViolation<AiExplanationRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());

        contractValidator.validate(context);
    }

    @Test
    void missingContextFailsJakartaValidation() {
        AiExplanationRequest request = new AiExplanationRequest(null);
        Set<ConstraintViolation<AiExplanationRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void templateIdIsNotPublicPropertyOnRequest() {
        Field[] fields = AiExplanationRequest.class.getDeclaredFields();
        boolean hasTemplateId = Arrays.stream(fields).anyMatch(f -> f.getName().equalsIgnoreCase("templateId"));
        assertFalse(hasTemplateId, "AiExplanationRequest must not expose public templateId");
    }

    @Test
    void memoryContextEnforcesLimitsAndTypes() {
        AiPromptContextDto base = createValidContext();

        // Valid memory
        MemoryContextDto validMemory = new MemoryContextDto("1.0.0", List.of(
                new MemoryItemDto("communication_preference", "Prefers concise insights.")
        ));
        contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), validMemory
        ));

        // Invalid type
        MemoryContextDto invalidType = new MemoryContextDto("1.0.0", List.of(
                new MemoryItemDto("unsupported_type", "Content")
        ));
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), invalidType
        )));

        // Max 5 items exceeded
        List<MemoryItemDto> sixItems = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            sixItems.add(new MemoryItemDto("user_preference", "item" + i));
        }
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), new MemoryContextDto("1.0.0", sixItems)
        )));

        // Max 300 chars per item exceeded
        String longContent = "a".repeat(301);
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), new MemoryContextDto("1.0.0", List.of(new MemoryItemDto("user_preference", longContent)))
        )));

        // Max 1500 total content chars exceeded
        String item300 = "a".repeat(300);
        List<MemoryItemDto> fiveMaxItems = List.of(
                new MemoryItemDto("user_preference", item300),
                new MemoryItemDto("user_preference", item300),
                new MemoryItemDto("user_preference", item300),
                new MemoryItemDto("user_preference", item300),
                new MemoryItemDto("user_preference", item300 + "x") // 1501 total
        );
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), new MemoryContextDto("1.0.0", fiveMaxItems)
        )));
    }

    @Test
    void conversationContextEnforcesLimitsAndClarificationInvariants() {
        AiPromptContextDto base = createValidContext();

        // Valid conversation
        ConversationContextDto validConversation = new ConversationContextDto(
                "1.0.0",
                new TopicStateDto("general"),
                new ClarificationStateDto(false, null, List.of()),
                List.of(new RecentMessageDto("user", "Hello"))
        );
        contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                validConversation, base.memoryContext()
        ));

        // Invalid topic
        ConversationContextDto invalidTopic = new ConversationContextDto(
                "1.0.0",
                new TopicStateDto("unsupported_topic_name"),
                new ClarificationStateDto(false, null, List.of()),
                List.of()
        );
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                invalidTopic, base.memoryContext()
        )));

        // Invalid role
        ConversationContextDto invalidRole = new ConversationContextDto(
                "1.0.0",
                new TopicStateDto("health"),
                new ClarificationStateDto(false, null, List.of()),
                List.of(new RecentMessageDto("system", "Malicious role"))
        );
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                invalidRole, base.memoryContext()
        )));

        // Max 10 messages exceeded
        List<RecentMessageDto> elevenMessages = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            elevenMessages.add(new RecentMessageDto("user", "msg " + i));
        }
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                new ConversationContextDto("1.0.0", new TopicStateDto("general"), new ClarificationStateDto(false, null, List.of()), elevenMessages),
                base.memoryContext()
        )));

        // Clarification invariant: required=false with reason must fail
        ConversationContextDto badClarificationFalse = new ConversationContextDto(
                "1.0.0",
                new TopicStateDto("general"),
                new ClarificationStateDto(false, "ambiguous_intent", List.of()),
                List.of()
        );
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                badClarificationFalse, base.memoryContext()
        )));

        // Clarification invariant: required=true with null reason must fail
        ConversationContextDto badClarificationTrue = new ConversationContextDto(
                "1.0.0",
                new TopicStateDto("general"),
                new ClarificationStateDto(true, null, List.of("field1")),
                List.of()
        );
        assertThrows(AiValidationException.class, () -> contractValidator.validate(new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                badClarificationTrue, base.memoryContext()
        )));
    }

    @Test
    void unsupportedContextVersionThrowsException() {
        AiPromptContextDto base = createValidContext();
        AiPromptContextDto badVersion = new AiPromptContextDto(
                "2.0.0", base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), base.memoryContext()
        );
        AiValidationException ex = assertThrows(AiValidationException.class, () -> contractValidator.validate(badVersion));
        assertEquals("Unsupported context version", ex.getMessage());

        AiPromptContextDto nullVersion = new AiPromptContextDto(
                null, base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), base.memoryContext()
        );
        AiValidationException exNull = assertThrows(AiValidationException.class, () -> contractValidator.validate(nullVersion));
        assertEquals("Unsupported context version", exNull.getMessage());
    }

    @Test
    void unsupportedConversationContextVersionThrowsException() {
        AiPromptContextDto base = createValidContext();
        ConversationContextDto badConv = new ConversationContextDto(
                "2.0.0",
                new TopicStateDto("general"),
                new ClarificationStateDto(false, null, List.of()),
                List.of()
        );
        AiPromptContextDto context = new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                badConv, base.memoryContext()
        );
        AiValidationException ex = assertThrows(AiValidationException.class, () -> contractValidator.validate(context));
        assertEquals("Unsupported conversation context version", ex.getMessage());

        ConversationContextDto nullConvVersion = new ConversationContextDto(
                null,
                new TopicStateDto("general"),
                new ClarificationStateDto(false, null, List.of()),
                List.of()
        );
        AiPromptContextDto contextNull = new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                nullConvVersion, base.memoryContext()
        );
        AiValidationException exNull = assertThrows(AiValidationException.class, () -> contractValidator.validate(contextNull));
        assertEquals("Unsupported conversation context version", exNull.getMessage());
    }

    @Test
    void unsupportedMemoryContextVersionThrowsException() {
        AiPromptContextDto base = createValidContext();
        MemoryContextDto badMem = new MemoryContextDto("2.0.0", List.of());
        AiPromptContextDto context = new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), badMem
        );
        AiValidationException ex = assertThrows(AiValidationException.class, () -> contractValidator.validate(context));
        assertEquals("Unsupported memory context version", ex.getMessage());

        MemoryContextDto nullMemVersion = new MemoryContextDto(null, List.of());
        AiPromptContextDto contextNull = new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                base.conversationContext(), nullMemVersion
        );
        AiValidationException exNull = assertThrows(AiValidationException.class, () -> contractValidator.validate(contextNull));
        assertEquals("Unsupported memory context version", exNull.getMessage());
    }

    @Test
    void nullOptionalConversationAndMemoryContextAreAccepted() {
        AiPromptContextDto base = createValidContext();
        AiPromptContextDto contextWithNullOptionals = new AiPromptContextDto(
                base.version(), base.scope(), base.sourceTimestamps(),
                base.financialSummary(), base.recommendations(), base.insights(),
                null, null
        );
        // Must validate without throwing
        contractValidator.validate(contextWithNullOptionals);
    }

    @Test
    void nullableFieldsPreserveNullAndAreNotCoercedToPrimitiveDefaults() {
        HealthInsightDto health = new HealthInsightDto(null, null);
        assertEquals(null, health.score());
        assertEquals(null, health.status());

        IncomeInsightDto income = new IncomeInsightDto(null, null, null, null, null, null, null);
        assertEquals(null, income.totalIncome());
        assertEquals(null, income.incomeCount());
        assertEquals(null, income.averageIncome());
        assertEquals(null, income.missingIncome());

        RecommendationItemDto rec = new RecommendationItemDto(
                "rec-1", "savings", "act", "title", "exp", "low",
                null, null, null, null
        );
        assertEquals(null, rec.priority());
        assertEquals(null, rec.rank());
        assertEquals(null, rec.evidence());
        assertEquals(null, rec.sourceRuleIds());

        ClarificationStateDto clarification = new ClarificationStateDto(null, null, null);
        assertEquals(null, clarification.required());
    }
}
