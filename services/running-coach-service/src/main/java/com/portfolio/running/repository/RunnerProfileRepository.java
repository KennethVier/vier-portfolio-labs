package com.portfolio.running.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portfolio.running.entity.RunnerProfile;

public interface RunnerProfileRepository extends JpaRepository<RunnerProfile, Long> {
    Optional<RunnerProfile> findByEmailIgnoreCase(String email);
}
