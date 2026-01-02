package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/login")
    public String showLoginPage() {
        return "login";
    }

    @GetMapping("/change-password")
    public String showChangePassword(@RequestParam Long userId, Model model) {
        model.addAttribute("userId", userId);
        return "change-password";
    }

    @PostMapping("/change-password")
    public String processChangePassword(
            @RequestParam Long userId,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            Model model) {

        // Debug logging
        System.out.println("Processing password change for userId: " + userId);
        System.out.println("New password length: " + newPassword.length());

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            model.addAttribute("error", "User not found");
            return "change-password";
        }

        // Check if passwords match
        if (!newPassword.equals(confirmPassword)) {
            model.addAttribute("error", "Passwords do not match");
            model.addAttribute("userId", userId); // Important: re-add userId
            return "change-password";
        }

        // Check password strength (optional)
        if (newPassword.length() < 6) {
            model.addAttribute("error", "Password must be at least 6 characters");
            model.addAttribute("userId", userId);
            return "change-password";
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);
        user.setStatus("Active");
        userRepository.save(user);

        model.addAttribute("message", "Password changed successfully. Please login with your new password.");
        return "login";
    }
    // to check only ...
    @GetMapping("/debug-redirect")
@ResponseBody
public String debugRedirect(HttpServletRequest request) {
    return "Current URL: " + request.getRequestURL() + 
           "<br>Query String: " + request.getQueryString() +
           "<br>Is first time login? Check your user's firstLogin field in database.";
}
}