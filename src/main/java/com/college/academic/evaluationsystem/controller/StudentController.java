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

    // ================= CREATE STUDENT =================
    @PostMapping
    public ResponseEntity<?> createStudent(@RequestBody Map<String, String> requestData) {
        try {
            // Extract data from request
            String fullName = requestData.get("fullName");
            String studentId = requestData.get("studentId");
            String username = requestData.get("username");
            String email = requestData.get("email");
            String password = requestData.get("password");
            String address = requestData.get("address");
            String contact = requestData.get("contact");
            String faculty = requestData.get("faculty");
            String semester = requestData.get("semester");
            String batch = requestData.get("batch");

            // Validate required fields
            if (fullName == null || fullName.isBlank()
                    || studentId == null || studentId.isBlank()
                    || username == null || username.isBlank()
                    || email == null || email.isBlank()
                    || password == null || password.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Required fields empty"));
            }

            // Check if student ID already exists
            if (studentRepository.existsByStudentId(studentId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Student ID already exists"));
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

            // Create new Student object
            Student student = new Student();
            student.setFullName(fullName);
            student.setStudentId(studentId);
            student.setAddress(address);
            student.setContact(contact);
            student.setFaculty(faculty);
            student.setSemester(semester);
            student.setBatch(batch);
            student.setStatus("Pending");
            student.setHide("0");
            
            // Set user credentials using the convenience method
            student.setUserCredentials(username, email, password);

            // Save student (will also create User record)
            Student savedStudent = studentService.saveStudent(student);
            return ResponseEntity.ok(savedStudent);

        } catch (Exception e) {
            e.printStackTrace(); // Add logging for debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ================= GET ALL STUDENTS =================
    @GetMapping
    public List<Student> getAllStudents() {
        // Only visible students
        return studentService.getAllStudents();
    }

    // ================= GET STUDENT BY USERNAME (For Profile) =================
    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getStudentProfile(@PathVariable String username) {
        Student student = studentService.getStudentByUsername(username);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(student);
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

        // Update student and user status
        student.setStatus(status);
        studentRepository.save(student);

        return ResponseEntity.ok(student);
    }

    // ================= UPDATE STUDENT =================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {

        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        // Update student fields
        if (data.containsKey("fullName")) {
            student.setFullName(data.get("fullName"));
        }
        if (data.containsKey("address")) {
            student.setAddress(data.get("address"));
        }
        if (data.containsKey("contact")) {
            student.setContact(data.get("contact"));
        }
        if (data.containsKey("faculty")) {
            student.setFaculty(data.get("faculty"));
        }
        if (data.containsKey("semester")) {
            student.setSemester(data.get("semester"));
        }
        if (data.containsKey("batch")) {
            student.setBatch(data.get("batch"));
        }

        // Update user credentials if provided
        if (data.containsKey("username")) {
            String newUsername = data.get("username");
            if (!newUsername.equals(student.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Username already exists"));
                }
                student.getUser().setUsername(newUsername);
            }
        }

        if (data.containsKey("email")) {
            String newEmail = data.get("email");
            if (!newEmail.equals(student.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Email already exists"));
                }
                student.getUser().setEmail(newEmail);
            }
        }

        Student updated = studentRepository.save(student);
        return ResponseEntity.ok(updated);
    }

    // ================= HIDE (Soft Delete) =================
    @PutMapping("/{id}/hide")
    public ResponseEntity<?> hideStudent(@PathVariable Long id) {
        Student student = studentService.hideStudent(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
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