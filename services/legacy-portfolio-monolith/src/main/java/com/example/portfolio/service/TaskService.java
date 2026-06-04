package com.example.portfolio.service;

import java.util.List;

import com.example.portfolio.dto.TaskDto;
import com.example.portfolio.model.UserTask;

public interface TaskService {

    List<TaskDto> getAllTasksByUserEmail(String userEmail);
    TaskDto addTask(TaskDto taskDto);
    TaskDto updateTask(String idTask, TaskDto taskDto);
    void deleteTask(String idTask);
    TaskDto getTaskById(String idTask);
    UserTask registerUser(String email);
}
