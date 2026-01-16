package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.Teacher;
import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;

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
@GetMapping("/admin/api/userinfo")
@ResponseBody
public Map<String, Object> getLoggedInUserInfo(Authentication authentication) {
    Map<String, Object> map = new HashMap<>();
    if (authentication == null) return map;

    // Use the injected 'repo' instead of UserRepository (static)
    User user = repo.findByUsername(authentication.getName()).orElse(null);
    if (user == null) return map;

    map.put("userId", user.getId());
    map.put("username", user.getUsername());
    map.put("email", user.getEmail());
    map.put("role", user.getRole());

    switch(user.getRole()) {
        case "STUDENT":
            // Use injected studentRepository
            studentRepository.findByUserId(user.getId()).ifPresent(s -> {
                map.put("studentId", s.getId());
                map.put("fullName", s.getFullName());
                map.put("contact", s.getContact());
                map.put("address", s.getAddress());
                map.put("batch", s.getBatch());
                map.put("semester", s.getSemester() != null ? s.getSemester().getName() : "-");
                map.put("department", s.getProgram() != null ? s.getProgram().getName() : "-");
            });
            break;

        case "TEACHER":
            teacherRepository.findByUserId(user.getId()).ifPresent(t -> {
                map.put("teacherId", t.getId());
                map.put("fullName", t.getFullName());
                map.put("contact", t.getContact());
                map.put("address", t.getAddress());
                map.put("department", t.getProgram() != null ? t.getProgram().getName() : "-");
            });
            break;

        case "ADMIN":
            map.put("fullName", user.getUsername());
            map.put("contact", "-");
            map.put("address", "-");
            map.put("department", "-");
            break;
    }

    return map;
}


}