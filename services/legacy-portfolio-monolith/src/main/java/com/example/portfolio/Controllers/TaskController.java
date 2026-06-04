package com.example.portfolio.Controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.portfolio.dto.TaskDto;
import com.example.portfolio.service.TaskService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/ToDoList")
public class TaskController {

    @Autowired
    TaskService taskService;

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> getTasksByUserEmail(@RequestParam("email") String email) {
        List<TaskDto> tasks = taskService.getAllTasksByUserEmail(email);
        return ResponseEntity.ok(tasks);
    }


    @GetMapping("{idTask}")
    public ResponseEntity<TaskDto> getTaskByIdTask(@PathVariable("idTask") String idTask){
        TaskDto taskDto = taskService.getTaskById(idTask);

        return ResponseEntity.ok(taskDto);
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestParam("email") String email) {
        try {
            taskService.registerUser(email);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }


    @PostMapping
    public ResponseEntity<TaskDto> addTask(@RequestBody TaskDto taskDto) {
        String generatedIdTask = UUID.randomUUID().toString();
        taskDto.setIdTask(generatedIdTask);

        TaskDto createdTask = taskService.addTask(taskDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask); 
    }

    @PutMapping("{idTask}")
    public ResponseEntity<TaskDto> updateTask(@PathVariable String idTask, @RequestBody TaskDto taskDto) {
        try {
            TaskDto updatedTask = taskService.updateTask(idTask, taskDto);
            return ResponseEntity.ok(updatedTask); 
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); 
        }
    }

    @DeleteMapping("{idTask}")
    public ResponseEntity<Void> deleteTask(@PathVariable String idTask) {
        try {
            taskService.deleteTask(idTask);
            return ResponseEntity.noContent().build();  
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

