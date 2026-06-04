package com.example.portfolio.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.portfolio.dto.TaskDto;
import com.example.portfolio.mapper.TaskMapper;
import com.example.portfolio.model.Task;
import com.example.portfolio.model.UserTask;
import com.example.portfolio.repository.TaskRepository;
import com.example.portfolio.repository.UserTaskRepository;
import com.example.portfolio.service.TaskService;

@Service
public class TaskServiceImpl implements TaskService {

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    UserTaskRepository userTaskRepository;

    @Override
    public TaskDto addTask(TaskDto taskDto) {
        UserTask userTask = userTaskRepository.findByEmail(taskDto.getUserEmail());
        if (userTask == null) {
            userTask = new UserTask();
            userTask.setEmail(taskDto.getUserEmail());
            userTaskRepository.save(userTask); 
        }


        Task task = TaskMapper.mapToTask(taskDto, userTask);
        task.setEmail(taskDto.getUserEmail());
        task.setCompletedDate(taskDto.getCompletedDate());
        task.setId(taskDto.getId());
        Task savedTask = taskRepository.save(task);

        return TaskMapper.mapToTaskDto(savedTask);
    }

    @Override
    public UserTask registerUser(String email) {
        UserTask existingUser = userTaskRepository.findByEmail(email);
        if (existingUser != null) {
            throw new RuntimeException("User already exists with email: " + email);
        }
        UserTask newUser = new UserTask();
        newUser.setEmail(email);
        return userTaskRepository.save(newUser);
    }

    @Override
    public TaskDto updateTask(String idTask, TaskDto taskDto) {
        Task task = taskRepository.findByIdTask(idTask)
                .orElseThrow(() -> new RuntimeException("Task not found."));

        task.setTitle(taskDto.getTitle());
        task.setStartDate(taskDto.getStartDate());
        task.setEndDate(taskDto.getEndDate());
        task.setCompletedDate(taskDto.getCompletedDate());
        task.setStatus(taskDto.getStatus());

        Task updatedTask = taskRepository.save(task);

        return TaskMapper.mapToTaskDto(updatedTask);
    }

    @Override
    public void deleteTask(String idTask) {
        Task task = taskRepository.findByIdTask(idTask)
                .orElseThrow(() -> new RuntimeException("Id Task not found."));

        taskRepository.delete(task);
    }

    @Override
    public List<TaskDto> getAllTasksByUserEmail(String userEmail) {
        UserTask userTask = userTaskRepository.findByEmail(userEmail);
        if (userTask == null) {
            throw new RuntimeException("User not found.");
        }

        return taskRepository.findByUser(userTask).stream()
                .map(TaskMapper::mapToTaskDto)
                .collect(Collectors.toList());
    }


    @Override
    public TaskDto getTaskById(String idTask) {
        Task task = taskRepository.findByIdTask(idTask)
            .orElseThrow(() -> new RuntimeException("Task not found!"));

        return TaskMapper.mapToTaskDto(task);
    }
}
