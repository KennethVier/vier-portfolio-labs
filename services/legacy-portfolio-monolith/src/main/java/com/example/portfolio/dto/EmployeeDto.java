package com.example.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// @JsonInclude(JsonInclude.Include.NON_NULL)
// @JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeDto {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String jobTitle;

    private String departmentName;

    private String departmentLead;

    // private int statusCode;
    // private String error;
    // private String message;
    // private String token;
    // private String refreshToken;
    // private String expirationTime;
    // private String password;
    // private String role;
    // private Employee ourUsers;
    // private List<Employee> ourUsersList;
    
}
