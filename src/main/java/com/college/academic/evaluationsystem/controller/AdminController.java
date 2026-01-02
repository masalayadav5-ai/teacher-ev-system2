package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.UUID;

@Controller
//@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // MAIN ADMIN DASHBOARD
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("username", "Admin");
        return "dashboard"; // Loads dashboard.html layout
    }


    // STATIC PAGES
    @GetMapping("/student")
    public String studentPage() { return "redirect:/pages/student.html"; }

    @GetMapping("/teachers")
    public String teacherPage() { return "redirect:/pages/teachers.html"; }

    @GetMapping("/evaluation")
    public String evaluationPage() { return "redirect:/pages/evaluation.html"; }

    @GetMapping("/session-planner")
    public String sessionPlannerPage() { return "redirect:/pages/session-planner.html"; }

    @GetMapping("/settings")
    public String settingsPage() { return "redirect:/pages/settings.html"; }

    //------------------------------------
    // CREATE USER
    //------------------------------------
    @PostMapping("/create-user")
    @ResponseBody
    public String createUser(@RequestParam String username, @RequestParam String email) {

        if (repo.findByUsername(username).isPresent()) return "username_exists";
        if (repo.findByEmail(email).isPresent()) return "email_exists";

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
         // enable immediately
        user.setStatus("Pending"); // default status
        user.setFirstLogin(true);   

        repo.save(user);

        String body = String.format("""
                Hello %s,
                
                Your account has been created.
                Temporary Password: %s
                
                You can login and change your password.
                """, username, tempPassword);

        emailService.sendSimpleMessage(email, "Account Created", body);

        return "ok";
    }

    // ===================== TOGGLE USER STATUS =====================
    @PutMapping("/users/{id}/status")
    @ResponseBody
    public String toggleUserStatus(@PathVariable Long id) {
        User user = repo.findById(id).orElse(null);
        if (user == null) return "User not found";

        // Toggle between "Pending" and "Active"
        String newStatus = "Pending".equals(user.getStatus()) ? "Active" : "Pending";
        user.setStatus(newStatus);

        

        repo.save(user);
        return "ok";
    }
    //------------------------------------
    // NEW: USER INFO ENDPOINT FOR STATIC PAGES
    //------------------------------------
    @GetMapping("/api/userinfo")
    @ResponseBody
    public Map<String, String> getUserInfo(Authentication authentication) {
        Map<String, String> map = new HashMap<>();

        if (authentication != null) {
            map.put("username", authentication.getName());

            String role = authentication.getAuthorities()
                    .stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_USER");

            map.put("role", role.replace("ROLE_", ""));
        } else {
            map.put("username", "Guest");
            map.put("role", "USER");
        }

        return map;
    }
}

 
