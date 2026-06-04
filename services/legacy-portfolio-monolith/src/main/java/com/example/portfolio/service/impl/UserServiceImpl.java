package com.example.portfolio.service.impl;

import com.example.portfolio.dto.UserDto;
import com.example.portfolio.model.Role;
import com.example.portfolio.model.RoleName;
import com.example.portfolio.model.User;
import com.example.portfolio.repository.RoleRepository;
import com.example.portfolio.repository.UserRepository;
import com.example.portfolio.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public User registerNewUser(UserDto userDto) {
        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("User Role not set."));
        roles.add(userRole);

        user.setRoles(roles);
        return userRepository.save(user);
    }

    @Override
    public User findByUsername(String username){
        return userRepository.findByUsername(username)
            .orElseThrow(()-> new RuntimeException("User not found!"));
    }

    @Override
    public void assignRoleToUser(String username, String roleName) {
        User user = userRepository.findByUsername(username) 
                .orElseThrow(() -> new RuntimeException("User not found.")); 
        Role role = roleRepository.findByName(RoleName.valueOf(roleName)) 
                .orElseThrow(() -> new RuntimeException("Role not found.")); 
            
        user.getRoles().add(role); 
        userRepository.save(user);
    }
}
