package com.vier.pesopilot.ai.controller;

import com.vier.pesopilot.ai.constant.AiApiConstants;
import com.vier.pesopilot.ai.dto.AiExplanationRequest;
import com.vier.pesopilot.ai.dto.streaming.AiStreamEventDto;
import com.vier.pesopilot.ai.execution.AiStreamingExecutionHandle;
import com.vier.pesopilot.ai.gateway.AiStreamingGateway;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping(AiApiConstants.EXPLANATIONS_STREAM_PATH)
public class AiStreamingExplanationController {

    private final AiStreamingGateway streamingGateway;

    public AiStreamingExplanationController(AiStreamingGateway streamingGateway) {
        this.streamingGateway = streamingGateway;
    }

    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamExplanation(@Valid @RequestBody AiExplanationRequest request) {
        SseEmitter emitter = new SseEmitter();

        AiStreamingExecutionHandle handle = streamingGateway.streamExplanation(request, event -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.eventType())
                        .data(event));

                if ("completed".equals(event.eventType())
                        || "cancelled".equals(event.eventType())
                        || "failed".equals(event.eventType())
                        || "timed_out".equals(event.eventType())) {
                    emitter.complete();
                }
            } catch (IOException | IllegalStateException e) {
                emitter.completeWithError(e);
            }
        });

        emitter.onCompletion(() -> {});
        emitter.onTimeout(() -> {
            if (handle != null) {
                handle.cancel();
            }
            emitter.complete();
        });
        emitter.onError(throwable -> {
            if (handle != null) {
                handle.cancel();
            }
        });

        return emitter;
    }
}
