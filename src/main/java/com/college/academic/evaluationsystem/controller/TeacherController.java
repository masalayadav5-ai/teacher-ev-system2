package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.Teacher;
import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teachers")
@CrossOrigin(origins = "*")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<?> createTeacher(@RequestBody Map<String, String> requestData) {
        try {
            // Extract data from request
            String fullName = requestData.get("fullName");
            String teacherId = requestData.get("teacherId");
            String username = requestData.get("username");
            String email = requestData.get("email");
            String password = requestData.get("password");
            String address = requestData.get("address");
            String contact = requestData.get("contact");
            String department = requestData.get("department");
            String qualification = requestData.get("qualification");
            String experienceStr = requestData.get("experience");

            // Validate required fields
            if (fullName == null || fullName.isBlank()
                    || teacherId == null || teacherId.isBlank()
                    || username == null || username.isBlank()
                    || email == null || email.isBlank()
                    || password == null || password.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Required fields empty"));
            }

            // Check if teacher ID already exists
            if (teacherRepository.existsByTeacherId(teacherId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Teacher ID already exists"));
            }

            // Check if email already exists in User table
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Email already exists"));
            }

            // Check if username already exists in User table
            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Username already exists"));
            }

            // Create new Teacher object
            Teacher teacher = new Teacher();
            teacher.setFullName(fullName);
            teacher.setTeacherId(teacherId);
            teacher.setAddress(address);
            teacher.setContact(contact);
            teacher.setDepartment(department);
            teacher.setQualification(qualification);
            teacher.setHide("0"); // Default visible
            
            // Parse experience
            try {
                if (experienceStr != null && !experienceStr.isBlank()) {
                    teacher.setExperience(Integer.parseInt(experienceStr));
                } else {
                    teacher.setExperience(0);
                }
            } catch (NumberFormatException e) {
                teacher.setExperience(0);
            }
            
            teacher.setStatus("Pending");
            
            // Set user credentials using the convenience method
            teacher.setUserCredentials(username, email, password);

            // Save teacher (will also create User record)
            Teacher savedTeacher = teacherService.saveTeacher(teacher);
            return ResponseEntity.ok(savedTeacher);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ================= READ =================
    @GetMapping
    public List<Teacher> getAllTeachers() {
        return teacherService.getAllTeachers();
    }

    // ================= GET TEACHER BY USERNAME (For Profile) =================
    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getTeacherProfile(@PathVariable String username) {
        Teacher teacher = teacherService.getTeacherByUsername(username);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(teacher);
    }

    // ================= UPDATE STATUS =================
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }

        String status = body.get("status");
        if (status == null || (!status.equalsIgnoreCase("Active") && !status.equalsIgnoreCase("Pending"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value"));
        }

        // Update teacher and user status
        teacher.setStatus(status);
        if (teacher.getUser() != null) {
            teacher.getUser().setStatus(status);
        }
        teacherRepository.save(teacher);

        return ResponseEntity.ok(teacher);
    }

    // ================= HIDE (Soft Delete) =================
    @PutMapping("/{id}/hide")
    public ResponseEntity<?> hideTeacher(@PathVariable Long id) {
        Teacher teacher = teacherService.hideTeacher(id);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("message", "Teacher hidden successfully"));
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeacher(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {

        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }

        // Update teacher fields
        if (data.containsKey("fullName")) {
            teacher.setFullName(data.get("fullName"));
        }
        if (data.containsKey("address")) {
            teacher.setAddress(data.get("address"));
        }
        if (data.containsKey("contact")) {
            teacher.setContact(data.get("contact"));
        }
        if (data.containsKey("department")) {
            teacher.setDepartment(data.get("department"));
        }
        if (data.containsKey("qualification")) {
            teacher.setQualification(data.get("qualification"));
        }
        if (data.containsKey("experience")) {
            try {
                teacher.setExperience(Integer.parseInt(data.get("experience")));
            } catch (NumberFormatException e) {
                // Keep existing value if invalid
            }
        }

        // Update user credentials if provided
        if (data.containsKey("username")) {
            String newUsername = data.get("username");
            if (!newUsername.equals(teacher.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Username already exists"));
                }
                teacher.getUser().setUsername(newUsername);
            }
        }

        if (data.containsKey("email")) {
            String newEmail = data.get("email");
            if (!newEmail.equals(teacher.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Email already exists"));
                }
                teacher.getUser().setEmail(newEmail);
            }
        }

        Teacher updated = teacherRepository.save(teacher);
        return ResponseEntity.ok(updated);
    }

    // ================= APPROVE TEACHER =================
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveTeacher(@PathVariable Long id) {
        Teacher teacher = teacherService.approveTeacher(id);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(teacher);
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.ok().build();
    }

    // ================= STATS =================
    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of(
                "total", teacherService.getTotalTeachers(),
                "active", teacherService.getActiveTeachersCount(),
                "pending", teacherService.getPendingTeachersCount()
        );
    }
}