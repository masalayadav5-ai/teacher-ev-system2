package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Create a user: admin supplies username + email.
    // The system generates a random temporary password (encoded) and OTP token sent in email.
    @PostMapping("/create-user")
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

        // Temporary random password (encoded). User must change it using the emailed token.
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));

        // create OTP token to allow immediate first-time password set
        String otp = UUID.randomUUID().toString();
        user.setOtpToken(otp);
        user.setOtpExpiry(Instant.now().plus(30, ChronoUnit.MINUTES)); // 30 minutes expiry
        user.setEnabled(false); // disabled until password reset

        repo.save(user);

        // Build link - update host/port as needed
        String link = "http://localhost:8080/auth/confirm?token=" + otp;

        String body = String.format("Hello %s,\n\nAn account was created for you.\n\n" +
                "Temporary password (not to be used): %s\n\n" +
                "To set your permanent password, open the link below within 30 minutes:\n%s\n\n" +
                "After setting a new password you will be able to log in.\n\nThanks.", username, tempPassword, link);

        emailService.sendSimpleMessage(email, "Your new account - set password", body);

        return "ok";
    }
}
