package com.vier.pesopilot.ai.validation;

import com.vier.pesopilot.ai.dto.context.AiPromptContextDto;
import com.vier.pesopilot.ai.dto.context.ClarificationStateDto;
import com.vier.pesopilot.ai.dto.context.ConversationContextDto;
import com.vier.pesopilot.ai.dto.context.MemoryContextDto;
import com.vier.pesopilot.ai.dto.context.MemoryItemDto;
import com.vier.pesopilot.ai.dto.context.RecentMessageDto;
import com.vier.pesopilot.ai.dto.context.TopicStateDto;
import com.vier.pesopilot.ai.exception.AiValidationException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
public class AiRequestContractValidator {

    private static final String SUPPORTED_VERSION = "1.0.0";

    private static final Set<String> ALLOWED_MEMORY_TYPES = Set.of(
            "communication_preference",
            "coaching_preference",
            "user_preference"
    );

    private static final Set<String> ALLOWED_CONVERSATION_ROLES = Set.of(
            "user",
            "assistant"
    );

    private static final Set<String> ALLOWED_CONVERSATION_TOPICS = Set.of(
            "cashflow",
            "cutoff",
            "expenses",
            "general",
            "goals",
            "health",
            "income",
            "recommendations",
            "savings",
            "summary"
    );

    private static final Set<String> ALLOWED_CLARIFICATION_REASONS = Set.of(
            "ambiguous_intent",
            "missing_financial_context",
            "unsupported_topic"
    );

    public void validate(AiPromptContextDto context) {
        if (context == null) {
            throw new AiValidationException("AI prompt context is required");
        }

        if (!SUPPORTED_VERSION.equals(context.version())) {
            throw new AiValidationException("Unsupported context version");
        }

        validateMemoryContext(context.memoryContext());
        validateConversationContext(context.conversationContext());
    }

    private void validateMemoryContext(MemoryContextDto memoryContext) {
        if (memoryContext == null) {
            return;
        }

        if (!SUPPORTED_VERSION.equals(memoryContext.version())) {
            throw new AiValidationException("Unsupported memory context version");
        }

        List<MemoryItemDto> items = memoryContext.items();
        if (items == null) {
            return;
        }

        if (items.size() > 5) {
            throw new AiValidationException("Memory context items exceed maximum limit of 5");
        }

        int totalChars = 0;
        for (MemoryItemDto item : items) {
            if (item == null) {
                throw new AiValidationException("Memory item must not be null");
            }

            if (item.type() == null || !ALLOWED_MEMORY_TYPES.contains(item.type())) {
                throw new AiValidationException("Unsupported memory type");
            }

            String content = item.content();
            if (content != null) {
                if (content.length() > 300) {
                    throw new AiValidationException("Memory item content exceeds maximum length of 300 characters");
                }
                totalChars += content.length();
            }
        }

        if (totalChars > 1500) {
            throw new AiValidationException("Total memory context content exceeds maximum limit of 1500 characters");
        }
    }

    private void validateConversationContext(ConversationContextDto conversationContext) {
        if (conversationContext == null) {
            return;
        }

        if (!SUPPORTED_VERSION.equals(conversationContext.version())) {
            throw new AiValidationException("Unsupported conversation context version");
        }

        TopicStateDto topic = conversationContext.topic();
        if (topic != null && topic.current() != null) {
            if (!ALLOWED_CONVERSATION_TOPICS.contains(topic.current())) {
                throw new AiValidationException("Unsupported conversation topic");
            }
        }

        ClarificationStateDto clarification = conversationContext.clarification();
        if (clarification != null) {
            boolean required = Boolean.TRUE.equals(clarification.required());
            String reason = clarification.reason();
            List<String> missingFields = clarification.missingFields();

            if (!required) {
                if (reason != null) {
                    throw new AiValidationException("Clarification reason must be null when required is false");
                }
                if (missingFields != null && !missingFields.isEmpty()) {
                    throw new AiValidationException("Clarification missingFields must be empty when required is false");
                }
            } else {
                if (reason == null || !ALLOWED_CLARIFICATION_REASONS.contains(reason)) {
                    throw new AiValidationException("Invalid clarification reason when clarification is required");
                }
                if (missingFields == null || missingFields.isEmpty()) {
                    throw new AiValidationException("Clarification missingFields must contain non-empty strings when required is true");
                }
                for (String field : missingFields) {
                    if (field == null || field.trim().isEmpty()) {
                        throw new AiValidationException("Clarification missingFields must contain non-empty strings");
                    }
                }
            }
        }

        List<RecentMessageDto> recentMessages = conversationContext.recentMessages();
        if (recentMessages != null) {
            if (recentMessages.size() > 10) {
                throw new AiValidationException("Conversation recent messages exceed maximum limit of 10");
            }
            for (RecentMessageDto message : recentMessages) {
                if (message == null) {
                    throw new AiValidationException("Recent message must not be null");
                }
                if (message.role() == null || !ALLOWED_CONVERSATION_ROLES.contains(message.role())) {
                    throw new AiValidationException("Unsupported conversation role");
                }
                if (message.content() != null && message.content().length() > 4000) {
                    throw new AiValidationException("Conversation message content exceeds maximum length of 4000 characters");
                }
            }
        }
    }
}
