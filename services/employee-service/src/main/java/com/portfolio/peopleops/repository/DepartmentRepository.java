package com.portfolio.peopleops.repository;

import com.portfolio.peopleops.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
