package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Teacher saveTeacher(Teacher teacher) {
        if (teacher.getStatus() == null) {
            teacher.setStatus("Pending");
        }
        
        // Check if username already exists in User table
        if (userRepository.existsByUsername(teacher.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        // Check if email already exists in User table
        if (userRepository.existsByEmail(teacher.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create and save User first
        User user = new User();
        user.setUsername(teacher.getUsername());
        user.setEmail(teacher.getEmail());
        user.setPassword(passwordEncoder.encode(teacher.getPassword()));
        user.setRole("TEACHER");
        user.setStatus(teacher.getStatus());
        user.setFirstLogin(true);
        
        User savedUser = userRepository.save(user);
        teacher.setUser(savedUser);
        
        // NOTE: Program should be set before saving
        // You'll need to pass programId and fetch program from repository
        return teacherRepository.save(teacher);
    }

    public List<Teacher> getAllTeachers() {
        // Get only visible teachers
        return teacherRepository.findByHide("0");
    }

    public Teacher getTeacherById(Long id) {
        // This will fetch the user relationship properly
        return teacherRepository.findById(id).orElse(null);
    }

    // Get teacher by username (for profile page)
    public Teacher getTeacherByUsername(String username) {
        return teacherRepository.findByUsername(username).orElse(null);
    }

    // Get teacher by email
    public Teacher getTeacherByEmail(String email) {
        return teacherRepository.findByUserEmail(email).orElse(null);
    }

    // ✅ UPDATE TEACHER WITH PROGRAM
    @Transactional
    public Teacher updateTeacher(Long id, Teacher data) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher == null) return null;

        teacher.setFullName(data.getFullName());
        teacher.setAddress(data.getAddress());
        teacher.setContact(data.getContact());
        teacher.setQualification(data.getQualification());
        teacher.setExperience(data.getExperience());
        
        // Update program if provided
        if (data.getProgram() != null) {
            teacher.setProgram(data.getProgram());
        }

        // Update user credentials if provided
        if (data.getUsername() != null && !data.getUsername().isEmpty()) {
            teacher.getUser().setUsername(data.getUsername());
        }
        if (data.getEmail() != null && !data.getEmail().isEmpty()) {
            teacher.getUser().setEmail(data.getEmail());
        }

        return teacherRepository.save(teacher);
    }

    // ✅ Assign Teacher to Program
    @Transactional
    public Teacher assignToProgram(Long teacherId, Long programId) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Program program = programRepository.findById(programId)
            .orElseThrow(() -> new RuntimeException("Program not found"));
        
        teacher.setProgram(program);
        return teacherRepository.save(teacher);
    }

    // ✅ HIDE TEACHER (SOFT DELETE)
    @Transactional
    public Teacher hideTeacher(Long id) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher != null) {
            teacher.setHide("1");
            teacher.setStatus("Pending");
            if (teacher.getUser() != null) {
                teacher.getUser().setStatus("Inactive");
            }
            return teacherRepository.save(teacher);
        }
        return null;
    }

    // ✅ DELETE TEACHER
    @Transactional
    public void deleteTeacher(Long id) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher != null && teacher.getUser() != null) {
            // Delete both teacher and user
            teacherRepository.delete(teacher);
            userRepository.delete(teacher.getUser());
        }
    }

    // ✅ APPROVE TEACHER
    @Transactional
    public Teacher approveTeacher(Long id) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher != null && teacher.getUser() != null) {
            teacher.setStatus("Active");
            teacher.getUser().setStatus("Active");
            return teacherRepository.save(teacher);
        }
        return null;
    }

    // ✅ Get teachers by program
    public List<Teacher> getTeachersByProgram(Long programId) {
        return teacherRepository.findByProgramId(programId);
    }

    public long getTotalTeachers() {
        return teacherRepository.countVisibleTeachers();
    }

    public long getActiveTeachersCount() {
        return teacherRepository.countByStatus("Active");
    }

    public long getPendingTeachersCount() {
        return teacherRepository.countByStatus("Pending");
    }
}