package com.portfolio.notification.client;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.portfolio.notification.dto.TaskDto;

@Component
public class TodoServiceClient {

    private final RestClient restClient;

    public TodoServiceClient(RestClient.Builder builder, @Value("${platform.todo-service.base-url}") String todoServiceBaseUrl) {
        this.restClient = builder.baseUrl(todoServiceBaseUrl).build();
    }

    public List<TaskDto> getAllTasks() {
        TaskDto[] tasks = restClient.get()
                .uri("/api/todos/internal/tasks")
                .retrieve()
                .body(TaskDto[].class);

        return tasks == null ? List.of() : Arrays.asList(tasks);
    }
}
