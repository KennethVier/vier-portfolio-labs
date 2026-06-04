package com.authenticaton.service.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.authenticaton.service.dto.AuthResponse;
import com.authenticaton.service.dto.RegisterRequest;
import com.authenticaton.service.entity.User;
import com.authenticaton.service.enums.AuthProvider;
import com.authenticaton.service.enums.Role;
import com.authenticaton.service.exception.EmailAlreadyExistsException;
import com.authenticaton.service.exception.InvalidRequestException;
import com.authenticaton.service.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtService jwtService;
    
    public AuthResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new EmailAlreadyExistsException("Email already registered");
        }

        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setRole(Role.USER);
        newUser.setProvider(AuthProvider.LOCAL);
        newUser.setCreatedAt(LocalDateTime.now((ZoneOffset.UTC)));

        userRepository.save(newUser);

        String token = jwtService.generateToken(newUser);

        AuthResponse response = AuthResponse.builder()
            .email(newUser.getEmail())
            .username(newUser.getUsername())
            .token(token)
            .build();

        return response;
    }

    public AuthResponse login(String email, String password) {
        email = email.trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidRequestException("Invalid email"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidRequestException("Invalid password");
        }

        String token = jwtService.generateToken(user);

        AuthResponse response = AuthResponse.builder()
                .email(user.getEmail())
                .username(user.getUsername())
                .token(token)
                .build();

        return response;
    }

}
