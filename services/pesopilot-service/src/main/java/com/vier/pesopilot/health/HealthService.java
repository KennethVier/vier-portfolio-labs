package com.vier.pesopilot.health;

import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public String getStatus() {
        return "UP";
    }
}
