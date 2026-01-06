package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByTeacherId(String teacherId);
    
    @Query("SELECT t FROM Teacher t WHERE t.user.email = :email")
    Optional<Teacher> findByUserEmail(@Param("email") String email);
    
    boolean existsByTeacherId(String teacherId);
    
    @Query("SELECT COUNT(t) > 0 FROM Teacher t WHERE t.user.email = :email")
    boolean existsByUserEmail(@Param("email") String email);
    
    // Find teacher by username through user relationship
    @Query("SELECT t FROM Teacher t JOIN FETCH t.user WHERE t.user.username = :username")
    Optional<Teacher> findByUsername(@Param("username") String username);
    
    // Get visible teachers only
    @Query("SELECT t FROM Teacher t JOIN FETCH t.user WHERE t.hide = :hide")
    List<Teacher> findByHide(@Param("hide") String hide);
    
    // Get all teachers with user eagerly fetched
    @Query("SELECT t FROM Teacher t JOIN FETCH t.user")
    List<Teacher> findAllWithUser();
    
    // Count methods
    @Query("SELECT COUNT(t) FROM Teacher t WHERE t.status = :status AND t.hide = '0'")
    long countByStatus(@Param("status") String status);
    
    @Query("SELECT COUNT(t) FROM Teacher t WHERE t.hide = '0'")
    long countVisibleTeachers();
}