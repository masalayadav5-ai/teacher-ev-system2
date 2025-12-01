package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;


    // =============================================================
    // 🟦 ADMIN DASHBOARD
    // =============================================================
    @GetMapping("/dashboard")
    public String dashboard(Authentication auth, Model model) {

        String username = (auth != null) ? auth.getName() : "Admin";
        model.addAttribute("username", username);

        return "dashboard";  // dashboard.html
    }


    // =============================================================
    // 🟦 CREATE USER
    // =============================================================
    @PostMapping("/create-user")
    @ResponseBody
    public String createUser(@RequestParam String username, @RequestParam String email) {

        if (repo.findByUsername(username).isPresent()) {
            return "username_exists";
        }
        if (repo.findByEmail(email).isPresent()) {
            return "email_exists";
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));

        String otp = UUID.randomUUID().toString();
        user.setOtpToken(otp);
        user.setOtpExpiry(Instant.now().plus(30, ChronoUnit.MINUTES));
        user.setEnabled(false);

        repo.save(user);

        String link = "http://localhost:8080/auth/confirm?token=" + otp;

        String body = String.format("Hello %s,\n\nYour account has been created.\n\n" +
                "Temporary Password: %s\n\n" +
                "Set your new permanent password using the link below:\n%s\n\n",
                username, tempPassword, link);

        emailService.sendSimpleMessage(email, "Your new account - set password", body);

        return "ok";
    }

}
