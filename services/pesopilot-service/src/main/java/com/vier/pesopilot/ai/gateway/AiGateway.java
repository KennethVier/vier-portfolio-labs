package com.vier.pesopilot.ai.gateway;

import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.AiExplanationResponse;

public interface AiGateway {

    AiExplanationResponse generateExplanation(AiExplanationRequest request);
}
