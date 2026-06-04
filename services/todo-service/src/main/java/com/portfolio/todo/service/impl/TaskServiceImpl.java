package com.portfolio.todo.service.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.todo.dto.TaskDto;
import com.portfolio.todo.exception.ResourceConflictException;
import com.portfolio.todo.exception.ResourceNotFoundException;
import com.portfolio.todo.mapper.TaskMapper;
import com.portfolio.todo.model.Task;
import com.portfolio.todo.model.UserTask;
import com.portfolio.todo.repository.TaskRepository;
import com.portfolio.todo.repository.UserTaskRepository;
import com.portfolio.todo.service.TaskService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserTaskRepository userTaskRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskDto> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(TaskMapper::mapToTaskDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDto> getAllTasksByUserEmail(String userEmail) {
        UserTask userTask = userTaskRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        return taskRepository.findByUserOrderByEndDateAsc(userTask).stream()
                .map(TaskMapper::mapToTaskDto)
                .toList();
    }

    @Override
    @Transactional
    public TaskDto addTask(TaskDto taskDto) {
        String userEmail = resolveEmail(taskDto);
        UserTask userTask = userTaskRepository.findByEmail(userEmail)
                .orElseGet(() -> userTaskRepository.save(UserTask.builder().email(userEmail).build()));

        if (taskDto.getIdTask() == null || taskDto.getIdTask().isBlank()) {
            taskDto.setIdTask(UUID.randomUUID().toString());
        }

        Task savedTask = taskRepository.save(TaskMapper.mapToTask(taskDto, userTask));
        return TaskMapper.mapToTaskDto(savedTask);
    }

    @Override
    @Transactional
    public TaskDto updateTask(String idTask, TaskDto taskDto) {
        Task task = taskRepository.findByIdTask(idTask)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));

        task.setTitle(taskDto.getTitle());
        task.setStartDate(taskDto.getStartDate());
        task.setEndDate(taskDto.getEndDate());
        task.setCompletedDate(taskDto.getCompletedDate());
        task.setStatus(taskDto.getStatus());

        return TaskMapper.mapToTaskDto(taskRepository.save(task));
    }

    @Override
    @Transactional
    public List<TaskDto> updateTasks(List<TaskDto> tasks) {
        return tasks.stream()
                .map(task -> updateTask(task.getIdTask(), task))
                .toList();
    }

    @Override
    @Transactional
    public void deleteTask(String idTask) {
        Task task = taskRepository.findByIdTask(idTask)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        taskRepository.delete(task);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDto getTaskById(String idTask) {
        Task task = taskRepository.findByIdTask(idTask)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        return TaskMapper.mapToTaskDto(task);
    }

    @Override
    @Transactional
    public void registerUser(String email) {
        userTaskRepository.findByEmail(email).ifPresent(existing -> {
            throw new ResourceConflictException("User already exists with email: " + email);
        });
        userTaskRepository.save(UserTask.builder().email(email).build());
    }

    private String resolveEmail(TaskDto taskDto) {
        if (taskDto.getUserEmail() != null && !taskDto.getUserEmail().isBlank()) {
            return taskDto.getUserEmail();
        }
        throw new IllegalArgumentException("User email is required.");
    }
}


