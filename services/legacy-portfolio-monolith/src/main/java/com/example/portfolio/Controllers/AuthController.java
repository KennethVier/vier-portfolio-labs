package com.example.portfolio.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import com.example.portfolio.dto.UserDto;
import com.example.portfolio.service.UserService;




@CrossOrigin("*")
@Controller
public class AuthController {
    @Autowired
    private UserService userService;

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new UserDto());
        return "register/register";
    }

    @GetMapping("/login")
    public String login(){
        return "login/login";
    }

    @GetMapping("/logout")
    public String logout(){
        return "logout/logout";
    }

    @PostMapping("/register")
    public String registerUser(UserDto userDto, Model model) {
        try {
            userService.registerNewUser(userDto);
            userService.assignRoleToUser(userDto.getUsername(), userDto.getRole());
            return "redirect:/login";
        } catch (Exception e) {
            model.addAttribute("error", "An error occurred while registering. Please try again.");
            return "register/register";
        }
    }
    
}
