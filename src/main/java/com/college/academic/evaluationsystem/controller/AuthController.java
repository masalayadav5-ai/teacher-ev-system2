package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // CHANGE PASSWORD PAGE
    @GetMapping("/change-password")
    public String changePasswordPage() {
        return "change-password"; // Thymeleaf view: change-password.html
    }

    @PostMapping("/change-password")
    public String changePassword(@RequestParam String username,
                                 @RequestParam String newPassword,
                                 Model model) {

        User user = repo.findByUsername(username).orElse(null);
        if (user == null) {
            model.addAttribute("message", "User not found.");
            return "auth-message";
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        repo.save(user);

        model.addAttribute("message", "Password changed successfully.");
        return "auth-message";
    }
}
