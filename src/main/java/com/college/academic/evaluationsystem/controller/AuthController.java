package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Link clicked from email
    @GetMapping("/confirm")
    public String confirmToken(@RequestParam("token") String token, Model model) {
        User user = repo.findByOtpToken(token).orElse(null);
        if (user == null) {
            model.addAttribute("message", "Invalid token.");
            return "auth-message";
        }
        if (user.getOtpExpiry() == null || Instant.now().isAfter(user.getOtpExpiry())) {
            model.addAttribute("message", "Token expired.");
            return "auth-message";
        }
        // token ok -> show change-password form
        model.addAttribute("token", token);
        return "set-password"; // create a Thymeleaf view named set-password.html
    }

    @PostMapping("/set-password")
    public String setPassword(@RequestParam("token") String token,
                              @RequestParam("password") String password,
                              Model model) {
        User user = repo.findByOtpToken(token).orElse(null);
        if (user == null) {
            model.addAttribute("message", "Invalid token.");
            return "auth-message";
        }
        if (user.getOtpExpiry() == null || Instant.now().isAfter(user.getOtpExpiry())) {
            model.addAttribute("message", "Token expired.");
            return "auth-message";
        }

        // set new password, enable account, clear token
        user.setPassword(passwordEncoder.encode(password));
        user.setEnabled(true);
        user.setOtpToken(null);
        user.setOtpExpiry(null);
        repo.save(user);

        model.addAttribute("message", "Password set successfully. You can now login.");
        return "auth-message"; // show message and a link to login
    }
}
