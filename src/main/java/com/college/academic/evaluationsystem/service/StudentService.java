package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import com.college.academic.evaluationsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Student saveStudent(Student student) {
        if (student.getStatus() == null) {
            student.setStatus("Pending");
        }
        
        // Check if username already exists in User table
        if (userRepository.existsByUsername(student.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        // Check if email already exists in User table
        if (userRepository.existsByEmail(student.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create and save User first
        User user = new User();
        user.setUsername(student.getUsername());
        user.setEmail(student.getEmail());
        user.setPassword(passwordEncoder.encode(student.getPassword()));
        user.setRole("STUDENT");
        user.setStatus(student.getStatus());
        user.setFirstLogin(true);
        
        User savedUser = userRepository.save(user);
        student.setUser(savedUser);
        
        return studentRepository.save(student);
    }

    public List<Student> getAllStudents() {
        // Use the method that fetches user eagerly
        return studentRepository.findByHide("0");
    }

    public List<Student> getAllStudentsWithUser() {
        return studentRepository.findAllWithUser();
    }

    public Student getStudentById(Long id) {
        // This will fetch the user relationship properly
        return studentRepository.findById(id).orElse(null);
    }

    // Get student by username (for profile page)
    public Student getStudentByUsername(String username) {
        return studentRepository.findByUsername(username);
    }

    // Get student by email
    public Student getStudentByEmail(String email) {
        return studentRepository.findByUserEmail(email);
    }

    // ✅ APPROVE STUDENT
    @Transactional
    public Student approveStudent(Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student != null && student.getUser() != null) {
            student.setStatus("Active");
            student.getUser().setStatus("Active");
            return studentRepository.save(student);
        }
        return null;
    }

    // ✅ UPDATE STUDENT
    @Transactional
    public Student updateStudent(Long id, Student data) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) return null;

        student.setFullName(data.getFullName());
        student.setAddress(data.getAddress());
        student.setContact(data.getContact());
        student.setFaculty(data.getFaculty());
        student.setSemester(data.getSemester());
        student.setBatch(data.getBatch());

        // Update user credentials if provided
        if (data.getUsername() != null && !data.getUsername().isEmpty()) {
            student.getUser().setUsername(data.getUsername());
        }
        if (data.getEmail() != null && !data.getEmail().isEmpty()) {
            student.getUser().setEmail(data.getEmail());
        }

        return studentRepository.save(student);
    }

    // ✅ DELETE STUDENT
    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student != null && student.getUser() != null) {
            // Delete both student and user
            studentRepository.delete(student);
            userRepository.delete(student.getUser());
        }
    }

    public long getTotalStudents() {
        return studentRepository.countByHide("0");
    }

    public long getActiveStudentsCount() {
        return studentRepository.countByStatus("Active");
    }

    public long getPendingStudentsCount() {
        return studentRepository.countByStatus("Pending");
    }
    
    // Hide student (soft delete)
    @Transactional
    public Student hideStudent(Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student != null) {
            student.setHide("1");
            student.setStatus("Pending");
            if (student.getUser() != null) {
                student.getUser().setStatus("Inactive");
            }
            return studentRepository.save(student);
        }
        return null;
    }
}