package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public Student saveStudent(Student student) {
        if (student.getStatus() == null) {
            student.setStatus("Pending");
        }
        return studentRepository.save(student);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id).orElse(null);
    }

    // ✅ APPROVE STUDENT
    public Student approveStudent(Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student != null) {
            student.setStatus("Active");
            return studentRepository.save(student);
        }
        return null;
    }

    // ✅ UPDATE STUDENT
    public Student updateStudent(Long id, Student data) {
        Student s = studentRepository.findById(id).orElse(null);
        if (s == null) return null;

        s.setFullName(data.getFullName());
        s.setUsername(data.getUsername());
        s.setAddress(data.getAddress());
        s.setContact(data.getContact());
        s.setFaculty(data.getFaculty());
        s.setSemester(data.getSemester());
        s.setBatch(data.getBatch());
        s.setEmail(data.getEmail());

        return studentRepository.save(s);
    }

    // ✅ DELETE STUDENT
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }

    public long getTotalStudents() {
        return studentRepository.count();
    }

    public long getActiveStudentsCount() {
        return studentRepository.findAll().stream()
                .filter(s -> "Active".equalsIgnoreCase(s.getStatus()))
                .count();
    }

    public long getPendingStudentsCount() {
        return studentRepository.findAll().stream()
                .filter(s -> "Pending".equalsIgnoreCase(s.getStatus()))
                .count();
    }
}
