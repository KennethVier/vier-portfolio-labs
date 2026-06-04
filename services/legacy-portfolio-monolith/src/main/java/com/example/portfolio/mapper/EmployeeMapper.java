package com.example.portfolio.mapper;

import com.example.portfolio.dto.EmployeeDto;
import com.example.portfolio.model.Employee;

public class EmployeeMapper {

    public static EmployeeDto mapToEmployeeDto(Employee employee)
    {
        return new EmployeeDto(
            employee.getId(),
            employee.getFirstName(),
            employee.getLastName(),
            employee.getEmail(),
            employee.getJobTitle(),
            employee.getDepartmentName(),
            employee.getDepartmentLead()
        );
    }

    public static Employee mapToEmployee(EmployeeDto employeeDto){
        return new Employee(
            employeeDto.getId(),
            employeeDto.getFirstName(),
            employeeDto.getLastName(),
            employeeDto.getEmail(),
            employeeDto.getJobTitle(),
            employeeDto.getDepartmentName(),
            employeeDto.getDepartmentLead()
        );
    }
}
