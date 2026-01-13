package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
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
    private ProgramRepository programRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ================= CREATE TEACHER =================
    @PostMapping
    public ResponseEntity<?> createTeacher(@RequestBody Map<String, Object> requestData) {
        try {
            // Extract data from request
            String fullName = (String) requestData.get("fullName");
            String teacherId = (String) requestData.get("teacherId");
            String username = (String) requestData.get("username");
            String email = (String) requestData.get("email");
            String password = (String) requestData.get("password");
            String address = (String) requestData.get("address");
            String contact = (String) requestData.get("contact");
            String qualification = (String) requestData.get("qualification");
            String experienceStr = (String) requestData.get("experience");
            
            // NEW: Extract programId (as Long or Integer)
            Long programId = null;
            if (requestData.get("programId") != null) {
                if (requestData.get("programId") instanceof Integer) {
                    programId = ((Integer) requestData.get("programId")).longValue();
                } else if (requestData.get("programId") instanceof Long) {
                    programId = (Long) requestData.get("programId");
                } else if (requestData.get("programId") instanceof String) {
                    programId = Long.parseLong((String) requestData.get("programId"));
                }
            }

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
            teacher.setQualification(qualification);
            teacher.setHide("0"); // Default visible
            
            // NEW: Set program relationship
            if (programId != null) {
                Program program = programRepository.findById(programId)
                    .orElseThrow(() -> new RuntimeException("Program not found"));
                teacher.setProgram(program);
            }
            
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

    // ================= GET ALL TEACHERS =================
    @GetMapping
    public List<Teacher> getAllTeachers() {
        return teacherService.getAllTeachers();
    }
    
    // NEW: Get teachers by program
    @GetMapping("/program/{programId}")
    public List<Teacher> getTeachersByProgram(@PathVariable Long programId) {
        return teacherService.getTeachersByProgram(programId);
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

    // ================= UPDATE TEACHER =================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeacher(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {

        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }

        // Update teacher fields
        if (data.containsKey("fullName")) {
            teacher.setFullName((String) data.get("fullName"));
        }
        if (data.containsKey("address")) {
            teacher.setAddress((String) data.get("address"));
        }
        if (data.containsKey("contact")) {
            teacher.setContact((String) data.get("contact"));
        }
        if (data.containsKey("qualification")) {
            teacher.setQualification((String) data.get("qualification"));
        }
        if (data.containsKey("experience")) {
            try {
                teacher.setExperience(Integer.parseInt((String) data.get("experience")));
            } catch (NumberFormatException e) {
                // Keep existing value if invalid
            }
        }
        
        // NEW: Update program relationship
        if (data.containsKey("programId")) {
            Long programId = null;
            Object programIdObj = data.get("programId");
            if (programIdObj instanceof Integer) {
                programId = ((Integer) programIdObj).longValue();
            } else if (programIdObj instanceof Long) {
                programId = (Long) programIdObj;
            } else if (programIdObj instanceof String) {
                programId = Long.parseLong((String) programIdObj);
            }
            
            if (programId != null) {
                Program program = programRepository.findById(programId)
                    .orElseThrow(() -> new RuntimeException("Program not found"));
                teacher.setProgram(program);
            }
        }

        // Update user credentials if provided
        if (data.containsKey("username")) {
            String newUsername = (String) data.get("username");
            if (!newUsername.equals(teacher.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Username already exists"));
                }
                teacher.getUser().setUsername(newUsername);
            }
        }

        if (data.containsKey("email")) {
            String newEmail = (String) data.get("email");
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

    // ================= ASSIGN TO PROGRAM =================
    @PutMapping("/{id}/assign-program")
    public ResponseEntity<?> assignToProgram(
            @PathVariable Long id,
            @RequestBody Map<String, Long> data) {
        
        Long programId = data.get("programId");
        if (programId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Program ID required"));
        }
        
        Teacher teacher = teacherService.assignToProgram(id, programId);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(teacher);
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