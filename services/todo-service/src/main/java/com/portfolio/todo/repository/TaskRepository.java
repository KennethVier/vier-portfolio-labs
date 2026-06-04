package com.portfolio.todo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.todo.model.Task;
import com.portfolio.todo.model.UserTask;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByIdTask(String idTask);
    List<Task> findByUserOrderByEndDateAsc(UserTask userTask);
}
