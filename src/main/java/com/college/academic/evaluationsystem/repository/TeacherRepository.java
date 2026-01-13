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
    
    // Check if teacher ID exists
    boolean existsByTeacherId(String teacherId);
    
    // Find teacher by username (through User relationship)
    @Query("SELECT t FROM Teacher t JOIN FETCH t.user u WHERE u.username = :username")
    Optional<Teacher> findByUsername(@Param("username") String username);
    
    // Find teacher by email (through User relationship)
    @Query("SELECT t FROM Teacher t JOIN FETCH t.user u WHERE u.email = :email")
    Optional<Teacher> findByUserEmail(@Param("email") String email);
    
    // Find teachers by visibility status
    List<Teacher> findByHide(String hide);
    
    // Count teachers by visibility status
    long countByHide(String hide);
    
    // Count teachers by status
    long countByStatus(String status);
    
    // Count visible teachers
    @Query("SELECT COUNT(t) FROM Teacher t WHERE t.hide = '0'")
    long countVisibleTeachers();
    
    // NEW: Find teachers by program
    List<Teacher> findByProgramId(Long programId);
    
    // NEW: Find teachers by program and status
    List<Teacher> findByProgramIdAndStatus(Long programId, String status);
    
    // NEW: Find teachers teaching a specific course
    @Query("SELECT DISTINCT t FROM Teacher t JOIN t.courses c WHERE c.id = :courseId")
    List<Teacher> findByCourseId(@Param("courseId") Long courseId);
    
    // NEW: Find active teachers by program
    @Query("SELECT t FROM Teacher t WHERE t.program.id = :programId AND t.status = 'Active'")
    List<Teacher> findActiveTeachersByProgram(@Param("programId") Long programId);
    
    // Find teacher by user ID
    @Query("SELECT t FROM Teacher t WHERE t.user.id = :userId")
    Optional<Teacher> findByUserId(@Param("userId") Long userId);
    
    // Find teachers with courses (for eager loading)
    @Query("SELECT DISTINCT t FROM Teacher t LEFT JOIN FETCH t.courses")
    List<Teacher> findAllWithCourses();
}