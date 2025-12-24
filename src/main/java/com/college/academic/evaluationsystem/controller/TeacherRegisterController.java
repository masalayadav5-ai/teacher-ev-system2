package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/teacher")
public class TeacherRegisterController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public String registerTeacher(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password
    ) {

        // Prevent duplicate email
        if (userRepository.findByEmail(email).isPresent()) {
            return "redirect:/teacher.html?error=email_exists";
        }

        User teacher = new User();
        teacher.setUsername(username);
        teacher.setEmail(email);
        teacher.setPassword(passwordEncoder.encode(password));
        teacher.setRole("ROLE_TEACHER");

        // choose ONE option:
        teacher.setEnabled(true);   // instant login
        // teacher.setEnabled(false); // admin approval required

        userRepository.save(teacher);

        return "redirect:/login?registered=true";
    }
}
