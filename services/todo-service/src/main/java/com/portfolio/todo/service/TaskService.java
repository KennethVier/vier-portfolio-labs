package com.portfolio.todo.service;

import java.util.List;

import com.portfolio.todo.dto.TaskDto;

public interface TaskService {
    List<TaskDto> getAllTasks();
    List<TaskDto> getAllTasksByUserEmail(String userEmail);
    TaskDto addTask(TaskDto taskDto);
    TaskDto updateTask(String idTask, TaskDto taskDto);
    List<TaskDto> updateTasks(List<TaskDto> tasks);
    void deleteTask(String idTask);
    TaskDto getTaskById(String idTask);
    void registerUser(String email);
}


