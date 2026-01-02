package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<?> createStudent(@RequestBody Student student) {

        if (student.getFullName() == null || student.getFullName().isBlank()
                || student.getStudentId() == null || student.getStudentId().isBlank()
                || student.getEmail() == null || student.getEmail().isBlank()
                || student.getPassword() == null || student.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Required fields empty"));
        }

        if (studentRepository.existsByStudentId(student.getStudentId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Student ID already exists"));
        }

        if (studentRepository.existsByEmail(student.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email already exists"));
        }

        student.setStatus("Pending"); // default status
        student.setHide("0"); // default visible
        return ResponseEntity.ok(studentService.saveStudent(student));
    }

    // ================= READ =================
    @GetMapping
    public List<Student> getAllStudents() {
        // Only visible students
        return studentRepository.findByHide("0");
    }

    // ================= UPDATE STATUS =================
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        String status = body.get("status");
        if (status == null || (!status.equalsIgnoreCase("Active") && !status.equalsIgnoreCase("Pending"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value"));
        }

        // Update student status
        student.setStatus(status);
        studentRepository.save(student);

        // Sync Users table
        User user = userRepository.findByUsername(student.getUsername()).orElse(null);

        if ("Active".equalsIgnoreCase(status)) {
            if (user == null) {
                // Pending → Active
                user = new User();
                user.setUsername(student.getUsername());
                user.setEmail(student.getEmail());
                user.setPassword(passwordEncoder.encode(student.getPassword()));
                user.setRole("STUDENT");
                user.setStatus("Active");
                userRepository.save(user);
            } else {
                user.setStatus("Active");
                userRepository.save(user);
            }
        } else {
            if (user != null) {
                // Active → Pending (deactivate user)
                user.setStatus("Inactive");
                userRepository.save(user);
            }
        }

        return ResponseEntity.ok(student);
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(
            @PathVariable Long id,
            @RequestBody Student student) {

        Student updated = studentService.updateStudent(id, student);
        return updated != null
                ? ResponseEntity.ok(updated)
                : ResponseEntity.notFound().build();
    }

    // ================= HIDE (Soft Delete) =================
    @PutMapping("/{id}/hide")
    public ResponseEntity<?> hideStudent(@PathVariable Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        if ("1".equals(student.getHide())) {
            return ResponseEntity.ok(Map.of("message", "Student already hidden"));
        }

        student.setHide("1"); // one-way hide
        student.setStatus("Pending"); // optional safety
        studentRepository.save(student);

        // Optional: deactivate user if exists
    User user = userRepository.findByEmail(student.getEmail()).orElse(null);
        if (user != null) {
            user.setStatus("Inactive");
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of("message", "Student hidden successfully"));
    }

    // ================= STATS =================
    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of(
                "total", studentService.getTotalStudents(),
                "active", studentService.getActiveStudentsCount(),
                "pending", studentService.getPendingStudentsCount()
        );
    }
}
