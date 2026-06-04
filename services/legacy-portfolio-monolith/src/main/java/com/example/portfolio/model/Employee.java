package com.example.portfolio.model;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "email")
    private String email;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "department_lead")
    private String departmentLead;

    // private String password;
    // private String role;

    // @Override implements UserDetails
    // public Collection<? extends GrantedAuthority> getAuthorities() {
    //    return List.of(new SimpleGrantedAuthority(role));
    // }
    // @Override
    // public String getUsername() {
    //    return email;
    // }
}
