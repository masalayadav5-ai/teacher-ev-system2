/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.college.academic.evaluationsystem.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

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
        return "department"; // if your teachers.html is named department.html
    }
}

