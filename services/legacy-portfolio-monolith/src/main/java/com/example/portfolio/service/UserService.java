package com.example.portfolio.service;


import com.example.portfolio.dto.UserDto;
import com.example.portfolio.model.User;

public interface UserService {
    User registerNewUser(UserDto userDto);
    User findByUsername(String username);
    void assignRoleToUser(String username, String roleName);
}
