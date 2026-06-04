package com.portfolio.peopleops.dto;

import java.time.LocalDateTime;

public record ActivityLogDto(Long id, String actorName, String action, String entityType, Long entityId,
        LocalDateTime createdAt) {}