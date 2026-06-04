package com.example.portfolio.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.portfolio.model.User;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByUsername(String username);
}
