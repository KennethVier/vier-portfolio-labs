package com.example.portfolio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.portfolio.model.UserTask;

public interface UserTaskRepository extends JpaRepository<UserTask, Long>{
    UserTask findByEmail(String email);

}
