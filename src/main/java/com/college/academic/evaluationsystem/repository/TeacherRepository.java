package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Teacher findByTeacherId(String teacherId);
    Teacher findByEmail(String email);
    boolean existsByTeacherId(String teacherId);
    boolean existsByEmail(String email);
}