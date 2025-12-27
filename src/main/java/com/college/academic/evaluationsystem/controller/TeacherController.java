package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.Teacher;
import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    public ResponseEntity<?> createTeacher(@RequestBody Teacher teacher) {
        if (teacher.getFullName() == null || teacher.getFullName().isBlank()
                || teacher.getTeacherId() == null || teacher.getTeacherId().isBlank()
                || teacher.getEmail() == null || teacher.getEmail().isBlank()
                || teacher.getPassword() == null || teacher.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Required fields empty"));
        }

        if (teacherRepository.existsByTeacherId(teacher.getTeacherId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Teacher ID already exists"));
        }

        if (teacherRepository.existsByEmail(teacher.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email already exists"));
        }

        teacher.setStatus("Pending");
        return ResponseEntity.ok(teacherService.saveTeacher(teacher));
    }

    // ================= READ =================
    @GetMapping
    public List<Teacher> getAllTeachers() {
        return teacherService.getAllTeachers();
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

        teacher.setStatus(status);
        teacherRepository.save(teacher);

        // ---- Sync with Users table ----
        User user = userRepository.findByUsername(teacher.getUsername()).orElse(null);

        if ("Active".equalsIgnoreCase(status)) {
            if (user == null) {
                user = new User();
                user.setUsername(teacher.getUsername());
                user.setEmail(teacher.getEmail());
                user.setPassword(passwordEncoder.encode(teacher.getPassword()));
                user.setRole("TEACHER");
                user.setStatus("Active");
                userRepository.save(user);
            } else {
                user.setStatus("Active");
                userRepository.save(user);
            }
        }

        return ResponseEntity.ok(teacher);
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeacher(
            @PathVariable Long id,
            @RequestBody Teacher teacher) {

        Teacher updated = teacherService.updateTeacher(id, teacher);
        return updated != null
                ? ResponseEntity.ok(updated)
                : ResponseEntity.notFound().build();
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