package com.college.academic.evaluationsystem.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "login";  // loads templates/login.html
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        return "dashboard"; // loads templates/dashboard.html
    }

    @GetMapping("/student")
    public String studentPage() {
        return "student"; // loads templates/student.html
    }

    @GetMapping("/teachers")
    public String teachersPage() {
        return "teacher-content"; // ✅ FIXED: loads teacher-content.html
    }
}