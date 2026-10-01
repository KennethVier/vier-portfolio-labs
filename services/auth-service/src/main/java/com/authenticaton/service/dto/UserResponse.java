package com.authenticaton.service.dto;

import com.authenticaton.service.enums.Role;

public record UserResponse(String email, String username, Role role) {
}
