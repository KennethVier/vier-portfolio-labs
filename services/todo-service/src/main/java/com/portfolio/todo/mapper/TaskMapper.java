package com.portfolio.todo.mapper;

import com.portfolio.todo.dto.TaskDto;
import com.portfolio.todo.model.Task;
import com.portfolio.todo.model.UserTask;

public final class TaskMapper {

    private TaskMapper() {
    }

    public static Task mapToTask(TaskDto taskDto, UserTask userTask) {
        return Task.builder()
                .id(taskDto.getId())
                .title(taskDto.getTitle())
                .startDate(taskDto.getStartDate())
                .endDate(taskDto.getEndDate())
                .completedDate(taskDto.getCompletedDate())
                .status(taskDto.getStatus())
                .email(userTask.getEmail())
                .idTask(taskDto.getIdTask())
                .user(userTask)
                .build();
    }

    public static TaskDto mapToTaskDto(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .completedDate(task.getCompletedDate())
                .status(task.getStatus())
                .userEmail(task.getUser().getEmail())
                .idTask(task.getIdTask())
                .build();
    }
}
