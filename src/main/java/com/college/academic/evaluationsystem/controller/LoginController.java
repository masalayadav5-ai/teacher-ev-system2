package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@Controller
public class LoginController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private StudentRepository studentRepository;

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
    @Transactional
    public String processChangePassword(
            @RequestParam Long userId,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            Model model) {

        // Debug logging
        System.out.println("Processing password change for userId: " + userId);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            model.addAttribute("error", "User not found");
            return "change-password";
        }

        // Check if passwords match
        if (!newPassword.equals(confirmPassword)) {
            model.addAttribute("error", "Passwords do not match");
            model.addAttribute("userId", userId);
            return "change-password";
        }

        // Check password strength
        if (newPassword.length() < 6) {
            model.addAttribute("error", "Password must be at least 6 characters");
            model.addAttribute("userId", userId);
            return "change-password";
        }

        // Update password in User table (encoded for Spring Security)
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        user.setFirstLogin(false);
        user.setStatus("Active");
        userRepository.save(user);

        // Find and update corresponding student (save PLAIN password)
        Student student = studentRepository.findByEmail(user.getEmail());
        
        if (student != null) {
            System.out.println("Found student with email: " + user.getEmail());
            
            // Save PLAIN password in Student table
            student.setPassword(newPassword); // Plain text password
            studentRepository.save(student);
            System.out.println("Plain password updated in Student table");
        } else {
            System.out.println("Warning: No student found with email: " + user.getEmail());
            // Try alternative search if email doesn't match
            student = studentRepository.findByStudentId(user.getUsername());
            if (student != null) {
                student.setPassword(newPassword); // Plain text password
                studentRepository.save(student);
                System.out.println("Plain password updated in Student table (found by username)");
            } else {
                System.out.println("Only User table password was updated (encoded)");
            }
        }

        model.addAttribute("message", "Password changed successfully. Please login with your new password.");
        return "login";
    }

    @GetMapping("/debug-redirect")
    @ResponseBody
    public String debugRedirect(HttpServletRequest request) {
        return "Current URL: " + request.getRequestURL() + 
               "<br>Query String: " + request.getQueryString() +
               "<br>Is first time login? Check your user's firstLogin field in database.";
    }
}