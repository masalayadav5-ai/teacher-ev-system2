package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    
    // Find semesters by program
    List<Semester> findByProgramId(Long programId);
    
    // Find active semesters by program
    List<Semester> findByProgramIdAndIsActive(Long programId, boolean isActive);
    
    // Find semester by program and name
    Optional<Semester> findByProgramIdAndName(Long programId, String name);
    
    // Find semesters by program ordered by order number
    @Query("SELECT s FROM Semester s WHERE s.program.id = :programId ORDER BY s.orderNumber")
    List<Semester> findByProgramIdOrdered(@Param("programId") Long programId);
    
    // Find active semesters by program ordered
    @Query("SELECT s FROM Semester s WHERE s.program.id = :programId AND s.isActive = true ORDER BY s.orderNumber")
    List<Semester> findActiveSemestersByProgram(@Param("programId") Long programId);
    
    // Find semester with courses count
    @Query("SELECT s, COUNT(c) as courseCount FROM Semester s LEFT JOIN s.courses c WHERE s.program.id = :programId GROUP BY s")
    List<Object[]> findSemestersWithCourseCount(@Param("programId") Long programId);
}