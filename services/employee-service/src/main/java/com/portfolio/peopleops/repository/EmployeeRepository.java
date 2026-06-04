package com.portfolio.peopleops.repository;

import com.portfolio.peopleops.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}
