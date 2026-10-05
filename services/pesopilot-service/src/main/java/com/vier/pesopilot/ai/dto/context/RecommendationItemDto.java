package com.vier.pesopilot.ai.dto.context;

import java.util.List;

public record RecommendationItemDto(
        String id,
        String domain,
        String actionKey,
        String title,
        String explanation,
        String severity,
        Integer priority,
        Integer rank,
        List<String> evidence,
        List<String> sourceRuleIds
) {}
