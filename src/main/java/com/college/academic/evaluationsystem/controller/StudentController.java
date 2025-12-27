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
        return ResponseEntity.ok(studentService.saveStudent(student));
    }

    // ================= READ =================
    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
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

    student.setStatus(status);
    studentRepository.save(student);

    // ---- Sync with Users table ----
    User user = userRepository.findByUsername(student.getUsername()).orElse(null);

    if ("Active".equalsIgnoreCase(status)) {
    if (user == null) {
        user = new User();
        user.setUsername(student.getUsername());
        user.setEmail(student.getEmail());
        user.setPassword(passwordEncoder.encode(student.getPassword())); // 🔐 hash here
        user.setRole("STUDENT");
        user.setStatus("Active");
        userRepository.save(user);
    } else {
        user.setStatus("Active");
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

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok().build();
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
