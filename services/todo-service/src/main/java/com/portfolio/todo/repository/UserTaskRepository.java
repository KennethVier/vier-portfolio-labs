package com.portfolio.todo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.todo.model.UserTask;

public interface UserTaskRepository extends JpaRepository<UserTask, Long> {
    Optional<UserTask> findByEmail(String email);
}
