package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Student;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findByStudentId(String studentId);
    Student findByEmail(String email);
    boolean existsByStudentId(String studentId);
    boolean existsByEmail(String email);
    List<Student> findByHide(String hide);
}
