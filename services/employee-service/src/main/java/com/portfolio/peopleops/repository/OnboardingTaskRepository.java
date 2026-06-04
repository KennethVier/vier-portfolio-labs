package com.portfolio.peopleops.repository;

import com.portfolio.peopleops.entity.OnboardingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, Long> {
    List<OnboardingTask> findByEmployeeId(Long employeeId);
}
