package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record ConversationContextDto(
        String version,
        TopicStateDto topic,
        ClarificationStateDto clarification,
        List<RecentMessageDto> recentMessages
) {}
