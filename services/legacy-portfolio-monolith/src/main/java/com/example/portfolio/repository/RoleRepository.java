package com.example.portfolio.repository;


import com.example.portfolio.model.Role;
import com.example.portfolio.model.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}

