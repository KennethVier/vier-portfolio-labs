package com.example.portfolio.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.portfolio.dto.EmployeeDto;
import com.example.portfolio.exception.ResourceNotFoundException;
import com.example.portfolio.mapper.EmployeeMapper;
import com.example.portfolio.model.Employee;
import com.example.portfolio.repository.EmployeeRepository;
import com.example.portfolio.service.EmployeeService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class EmployeeServiceImpl implements EmployeeService{

    @Autowired
    private EmployeeRepository employeeRepository;
   
    @Override
    public EmployeeDto createEmployee(EmployeeDto employeeDto) {
        
        Employee employee = EmployeeMapper.mapToEmployee(employeeDto);

        Employee savedEmployee = employeeRepository.save(employee);
        
        

        return EmployeeMapper.mapToEmployeeDto(savedEmployee);
    }

    @Override
    public EmployeeDto getEmployeeById(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> 
                new ResourceNotFoundException("Employee is not existing with the given Id: " + employeeId));

        return EmployeeMapper.mapToEmployeeDto(employee);
    }

    @Override
    public List<EmployeeDto> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();

        return employees.stream().map(
            (employee) -> EmployeeMapper.mapToEmployeeDto(employee))
                .collect(Collectors.toList());
    }

    @Override
    public EmployeeDto updateEmployee(Long employeeId, EmployeeDto updatedEmployee) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> 
                new ResourceNotFoundException("Employee does not exist with the given Id" + employeeId)
        );

        employee.setFirstName(updatedEmployee.getFirstName());
        employee.setLastName(updatedEmployee.getLastName());
        employee.setEmail(updatedEmployee.getEmail());
        employee.setJobTitle(updatedEmployee.getJobTitle());
        employee.setDepartmentName(updatedEmployee.getDepartmentName());
        employee.setDepartmentLead(updatedEmployee.getDepartmentLead());

        Employee updatedEmployeeObj = employeeRepository.save(employee);

        return EmployeeMapper.mapToEmployeeDto(updatedEmployeeObj);
    }

    @Override
    public void deleteEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() ->
                new ResourceNotFoundException("Employee does not exist with the given Id" + employeeId)
            );

        employeeRepository.deleteById(employeeId); 
    }

}
