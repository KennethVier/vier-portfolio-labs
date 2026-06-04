package com.example.portfolio.mapper;

import com.example.portfolio.dto.TaskDto;
import com.example.portfolio.model.Task;
import com.example.portfolio.model.UserTask;

public class TaskMapper {
    public static Task mapToTask(TaskDto taskDto, UserTask userTask) {
        Task task = new Task();
        task.setId(taskDto.getId());
        task.setTitle(taskDto.getTitle());
        task.setStartDate(taskDto.getStartDate());
        task.setEndDate(taskDto.getEndDate());
        task.setCompletedDate(taskDto.getCompletedDate());
        task.setStatus(taskDto.getStatus());
        task.setUser(userTask); 
        task.setIdTask(taskDto.getIdTask());

        return task;
    }

    public static TaskDto mapToTaskDto(Task task) {
        TaskDto taskDto = new TaskDto();
        taskDto.setId(task.getId());
        taskDto.setTitle(task.getTitle());
        taskDto.setStartDate(task.getStartDate());
        taskDto.setEndDate(task.getEndDate());
        taskDto.setCompletedDate(task.getCompletedDate());
        taskDto.setStatus(task.getStatus());
        taskDto.setUserEmail(task.getUser().getEmail());
        taskDto.setIdTask(task.getIdTask());  

        return taskDto;
    }
}

