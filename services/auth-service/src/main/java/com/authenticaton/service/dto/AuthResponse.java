package com.authenticaton.service.dto;

import lombok.*;

@Data
@Builder
public class AuthResponse {
    private String email;
    private String token;
    private String username;
}
