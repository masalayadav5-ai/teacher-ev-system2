package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Student;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findByStudentId(String studentId);
    
    @Query("SELECT s FROM Student s WHERE s.user.email = :email")
    Student findByUserEmail(@Param("email") String email);
    
    boolean existsByStudentId(String studentId);
    
    @Query("SELECT COUNT(s) > 0 FROM Student s WHERE s.user.email = :email")
    boolean existsByUserEmail(@Param("email") String email);
    
    // Fix: Add JOIN FETCH to properly load the User relationship
    @Query("SELECT s FROM Student s JOIN FETCH s.user WHERE s.hide = :hide")
    List<Student> findByHide(@Param("hide") String hide);
    
    // Find student by username through user relationship
    @Query("SELECT s FROM Student s JOIN FETCH s.user WHERE s.user.username = :username")
    Student findByUsername(@Param("username") String username);
    
    // Add a method to find all students with user eagerly fetched
    @Query("SELECT s FROM Student s JOIN FETCH s.user")
    List<Student> findAllWithUser();
    
    // Count methods with user condition
    @Query("SELECT COUNT(s) FROM Student s WHERE s.hide = :hide")
    long countByHide(@Param("hide") String hide);
    
    @Query("SELECT COUNT(s) FROM Student s WHERE s.status = :status")
    long countByStatus(@Param("status") String status);
}