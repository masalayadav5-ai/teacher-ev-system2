package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    // Check if student ID exists
    boolean existsByStudentId(String studentId);
    
    // Find student by username (through User relationship)
    @Query("SELECT s FROM Student s JOIN FETCH s.user u WHERE u.username = :username")
    Student findByUsername(@Param("username") String username);
    
    // Find student by email (through User relationship)
    @Query("SELECT s FROM Student s JOIN FETCH s.user u WHERE u.email = :email")
    Student findByUserEmail(@Param("email") String email);
    
    // Find students by visibility status
    List<Student> findByHide(String hide);
    
    // Count students by visibility status
    long countByHide(String hide);
    
    // Count students by status
    long countByStatus(String status);
    
    // Get all students with user eagerly fetched
    @Query("SELECT s FROM Student s JOIN FETCH s.user")
    List<Student> findAllWithUser();
    
    // NEW: Find students by program
    List<Student> findByProgramId(Long programId);
    
    // NEW: Find students by semester
    List<Student> findBySemesterId(Long semesterId);
    
    // NEW: Find students by program and semester
    List<Student> findByProgramIdAndSemesterId(Long programId, Long semesterId);
    
    // NEW: Find students by program and status
    List<Student> findByProgramIdAndStatus(Long programId, String status);
    
    // NEW: Find students by batch
    List<Student> findByBatchLabel(String batchLabel);

    
    // NEW: Find active students by program
    @Query("SELECT s FROM Student s WHERE s.program.id = :programId AND s.status = 'Active'")
    List<Student> findActiveStudentsByProgram(@Param("programId") Long programId);
    
    // Find student by user ID
    @Query("SELECT s FROM Student s WHERE s.user.id = :userId")
    Optional<Student> findByUserId(@Param("userId") Long userId);
    
      @Query("SELECT s FROM Student s " +
           "JOIN FETCH s.user u " +
           "LEFT JOIN FETCH s.program p " +
           "LEFT JOIN FETCH s.semester sem " +
           "WHERE s.hide = '0'")
    List<Student> findAllVisibleWithRelations();
    // Add this method to StudentRepository:
@Query("SELECT COUNT(s) FROM Student s WHERE s.program.id = :programId AND s.hide = '0' AND s.status = 'Active'")
long countActiveStudentsByProgram(@Param("programId") Long programId);

}