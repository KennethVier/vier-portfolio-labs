package com.vier.pesopilot.ai.controller;

import com.vier.pesopilot.ai.constant.AiApiConstants;
import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.AiExplanationResponse;
import com.vier.pesopilot.ai.gateway.AiGateway;
import com.vier.pesopilot.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(AiApiConstants.EXPLANATIONS_PATH)
public class AiExplanationController {

    private final AiGateway aiGateway;

    public AiExplanationController(AiGateway aiGateway) {
        this.aiGateway = aiGateway;
    }

    @PostMapping
    public ApiResponse<AiExplanationResponse> explain(@Valid @RequestBody AiExplanationRequest request) {
        AiExplanationResponse response = aiGateway.generateExplanation(request);
        return ApiResponse.success("Success", response);
    }
}
