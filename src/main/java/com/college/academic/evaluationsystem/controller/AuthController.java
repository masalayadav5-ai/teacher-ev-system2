package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "username and password required"
            ));
        }

        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "User not found"
            ));
        }

        if (!"STUDENT".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Only students can login in this app"
            ));
        }

        if (!"Active".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Account is not active"
            ));
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Invalid password"
            ));
        }

        Student student = studentRepository.findByUserId(user.getId()).orElse(null);

   return ResponseEntity.ok(Map.of(
    "success", true,
    "userId", user.getId(),
    "username", user.getUsername(),
    "email", user.getEmail(),
    "studentId", student != null ? student.getId() : null,
    "fullName", student != null ? student.getFullName() : null,
    "firstLogin", user.isFirstLogin()  
));
    }
}