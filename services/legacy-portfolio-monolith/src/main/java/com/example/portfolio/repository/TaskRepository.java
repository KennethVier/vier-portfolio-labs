package com.example.portfolio.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.portfolio.model.Task;
import com.example.portfolio.model.UserTask;

public interface TaskRepository extends JpaRepository<Task, Long>{
    Optional<Task> findByIdTask(String idTask);
    List<Task> findByUser(UserTask userTask);

}
