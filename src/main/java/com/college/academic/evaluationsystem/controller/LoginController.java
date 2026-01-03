package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 🔒 Strong password regex
    private static final String STRONG_PASSWORD_REGEX =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

    // =========================
    // LOGIN PAGE
    // =========================
    @GetMapping("/login")
    public String showLoginPage(
            @RequestParam(required = false) Boolean firstLogin,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String passwordChanged,
            HttpServletRequest request,
            Model model) {

        if (Boolean.TRUE.equals(firstLogin) && userId != null) {
            model.addAttribute("forcePasswordChange", true);
            model.addAttribute("userId", userId);

            if (error != null) {
                model.addAttribute("error", error);
            }
        }

        if (passwordChanged != null) {
            model.addAttribute("passwordChanged", true);
        }

        return "login";
    }

    // =========================
    // CHANGE PASSWORD
    // =========================
    @PostMapping("/change-password")
    @Transactional
    public String processChangePassword(
            @RequestParam Long userId,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            Model model) {

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return returnError(model, "User not found", userId);
        }

        // 1️⃣ Check password match
        if (!newPassword.equals(confirmPassword)) {
            return returnError(model, "Passwords do not match", userId);
        }

        // 2️⃣ Strong password validation
        if (!newPassword.matches(STRONG_PASSWORD_REGEX)) {
            return returnError(
                    model,
                    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                    userId
            );
        }

        // 3️⃣ Update User table (ENCODED)
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);
        user.setStatus("Active");
        userRepository.save(user);

        // 4️⃣ Update Student table (PLAIN TEXT – as per your design)
        Student student = studentRepository.findByEmail(user.getEmail());

        if (student != null) {
            student.setPassword(newPassword);
            student.setStatus("Active");
            studentRepository.save(student);
        } else {
            student = studentRepository.findByStudentId(user.getUsername());
            if (student != null) {
                student.setPassword(newPassword);
                studentRepository.save(student);
            }
        }

        return "redirect:/login?passwordChanged=true";
    }

    // =========================
    // COMMON ERROR HANDLER
    // =========================
    private String returnError(Model model, String message, Long userId) {
        model.addAttribute("error", message);
        model.addAttribute("forcePasswordChange", true);
        model.addAttribute("userId", userId);
        return "login";
    }

    // =========================
    // DEBUG ENDPOINT
    // =========================
    @GetMapping("/debug-redirect")
    @ResponseBody
    public String debugRedirect(HttpServletRequest request) {
        return "URL: " + request.getRequestURL()
                + "<br>Query: " + request.getQueryString();
    }
}
