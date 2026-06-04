package com.portfolio.todo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.todo.dto.TaskDto;
import com.portfolio.todo.service.TaskService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/internal/tasks")
    public ResponseEntity<List<TaskDto>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> getTasksByUserEmail(@RequestParam("email") @Email String email) {
        return ResponseEntity.ok(taskService.getAllTasksByUserEmail(email));
    }

    @GetMapping("/{idTask}")
    public ResponseEntity<TaskDto> getTaskByIdTask(@PathVariable String idTask) {
        return ResponseEntity.ok(taskService.getTaskById(idTask));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@RequestParam("email") @Email String email) {
        taskService.registerUser(email);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully."));
    }

    @PostMapping
    public ResponseEntity<TaskDto> addTask(@Valid @RequestBody TaskDto taskDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addTask(taskDto));
    }

    @PutMapping("/{idTask}")
    public ResponseEntity<TaskDto> updateTask(@PathVariable String idTask, @Valid @RequestBody TaskDto taskDto) {
        return ResponseEntity.ok(taskService.updateTask(idTask, taskDto));
    }

    @PutMapping("/tasks/batch-update")
    public ResponseEntity<List<TaskDto>> updateTasks(@RequestBody List<@Valid TaskDto> tasks) {
        return ResponseEntity.ok(taskService.updateTasks(tasks));
    }

    @DeleteMapping("/{idTask}")
    public ResponseEntity<Void> deleteTask(@PathVariable String idTask) {
        taskService.deleteTask(idTask);
        return ResponseEntity.noContent().build();
    }
}


