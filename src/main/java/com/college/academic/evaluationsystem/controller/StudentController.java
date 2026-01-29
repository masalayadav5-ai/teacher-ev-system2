package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
import com.college.academic.evaluationsystem.service.StudentService;
import java.util.ArrayList;
import java.util.HashMap;
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
private TeacherRepository teacherRepository;

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    // ================= CREATE STUDENT =================
    @PostMapping
    public ResponseEntity<?> createStudent(@RequestBody Map<String, Object> requestData) {
        try {
            // Extract data from request
            String fullName = (String) requestData.get("fullName");
            String studentId = (String) requestData.get("studentId");
            String username = (String) requestData.get("username");
            String email = (String) requestData.get("email");
            String password = (String) requestData.get("password");
            String address = (String) requestData.get("address");
            String contact = (String) requestData.get("contact");
            String batchLabel  = (String) requestData.get("batch");
            
            // NEW: Extract programId and semesterId (as Long or Integer)
            Long programId = null;
            Long semesterId = null;
            
            if (requestData.get("programId") != null) {
                if (requestData.get("programId") instanceof Integer) {
                    programId = ((Integer) requestData.get("programId")).longValue();
                } else if (requestData.get("programId") instanceof Long) {
                    programId = (Long) requestData.get("programId");
                } else if (requestData.get("programId") instanceof String) {
                    programId = Long.parseLong((String) requestData.get("programId"));
                }
            }
            
            if (requestData.get("semesterId") != null) {
                if (requestData.get("semesterId") instanceof Integer) {
                    semesterId = ((Integer) requestData.get("semesterId")).longValue();
                } else if (requestData.get("semesterId") instanceof Long) {
                    semesterId = (Long) requestData.get("semesterId");
                } else if (requestData.get("semesterId") instanceof String) {
                    semesterId = Long.parseLong((String) requestData.get("semesterId"));
                }
            }

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
            student.setBatchLabel(batchLabel);
            student.setStatus("Pending");
            student.setHide("0");
            
            // NEW: Set program and semester relationships
          if (programId != null) {
    Program program = programRepository.findById(programId)
        .orElseThrow(() -> new RuntimeException("Program not found"));
    student.setProgram(program);
}

if (semesterId != null) {
    Semester semester = semesterRepository.findById(semesterId)
        .orElseThrow(() -> new RuntimeException("Semester not found"));
    student.setSemester(semester);
}
            
            // Set user credentials using the convenience method
            student.setUserCredentials(username, email, password);

            // Save student (will also create User record)
            Student savedStudent = studentService.saveStudent(student);
            return ResponseEntity.ok(savedStudent);

        } catch (Exception e) {
            e.printStackTrace();
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
    
    // NEW: Get students by program
    @GetMapping("/program/{programId}")
    public List<Student> getStudentsByProgram(@PathVariable Long programId) {
        return studentService.getStudentsByProgram(programId);
    }
    
    // NEW: Get students by program and semester
    @GetMapping("/program/{programId}/semester/{semesterId}")
    public List<Student> getStudentsByProgramAndSemester(@PathVariable Long programId, @PathVariable Long semesterId) {
        return studentService.getStudentsByProgramAndSemester(programId, semesterId);
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
            @RequestBody Map<String, Object> data) {

        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        // Update student fields
        if (data.containsKey("fullName")) {
            student.setFullName((String) data.get("fullName"));
        }
        if (data.containsKey("address")) {
            student.setAddress((String) data.get("address"));
        }
        if (data.containsKey("contact")) {
            student.setContact((String) data.get("contact"));
        }
       if (data.containsKey("batch")) {
    student.setBatchLabel((String) data.get("batch"));
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
                student.setProgram(program);
            }
        }
        
        // NEW: Update semester relationship
        if (data.containsKey("semesterId")) {
            Long semesterId = null;
            Object semesterIdObj = data.get("semesterId");
            if (semesterIdObj instanceof Integer) {
                semesterId = ((Integer) semesterIdObj).longValue();
            } else if (semesterIdObj instanceof Long) {
                semesterId = (Long) semesterIdObj;
            } else if (semesterIdObj instanceof String) {
                semesterId = Long.parseLong((String) semesterIdObj);
            }
            
            if (semesterId != null) {
                Semester semester = semesterRepository.findById(semesterId)
                    .orElseThrow(() -> new RuntimeException("Semester not found"));
                student.setSemester(semester);
            }
        }

        // Update user credentials if provided
        if (data.containsKey("username")) {
            String newUsername = (String) data.get("username");
            if (!newUsername.equals(student.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Username already exists"));
                }
                student.getUser().setUsername(newUsername);
            }
        }

        if (data.containsKey("email")) {
            String newEmail = (String) data.get("email");
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

    // ================= APPROVE STUDENT =================
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveStudent(@PathVariable Long id) {
        Student student = studentService.approveStudent(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(student);
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
    
  // Add this endpoint to StudentController.java
@GetMapping("/{studentId}/teacher-courses")
public ResponseEntity<?> getStudentTeacherCourses(@PathVariable Long studentId) {
    try {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Get student's program and semester
        Program program = student.getProgram();
        Semester semester = student.getSemester();
        
        if (program == null || semester == null) {
            return ResponseEntity.ok(List.of());
        }
        
        // Fetch teachers with their courses for this semester
        List<Object[]> results = teacherRepository.findTeachersWithCoursesByProgramAndSemester(
            program.getId(), semester.getId());
        
        // Create a list of teacher-course objects
        List<Map<String, Object>> teacherCourses = new ArrayList<>();
        for (Object[] result : results) {
            Teacher teacher = (Teacher) result[0];
            Course course = (Course) result[1];
            
            Map<String, Object> teacherCourse = new HashMap<>();
            teacherCourse.put("teacherId", teacher.getId());
            teacherCourse.put("teacherName", teacher.getFullName());
            teacherCourse.put("teacherEmail", teacher.getEmail());
            teacherCourse.put("teacherQualification", teacher.getQualification());
            teacherCourse.put("teacherExperience", teacher.getExperience());
            teacherCourse.put("courseId", course.getId());
            teacherCourse.put("courseCode", course.getCode());
            teacherCourse.put("courseName", course.getName());
            teacherCourse.put("courseDescription", course.getDescription());
            teacherCourse.put("courseCredits", course.getCredits());
            teacherCourse.put("programName", program.getName());
            
            teacherCourses.add(teacherCourse);
        }
        
        return ResponseEntity.ok(teacherCourses);
        
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(
            Map.of("message", "Error fetching teacher courses"));
    }
}
}