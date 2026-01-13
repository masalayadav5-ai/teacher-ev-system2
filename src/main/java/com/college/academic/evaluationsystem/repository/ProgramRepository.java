package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Program;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProgramRepository extends JpaRepository<Program, Long> {
    
    // Find program by name
    Optional<Program> findByName(String name);
    
    // Find program by code
    Optional<Program> findByCode(String code);
    
    // Find active programs
    List<Program> findByIsActive(boolean isActive);
    
    // Find programs with students count
    @Query("SELECT p, COUNT(s) as studentCount FROM Program p LEFT JOIN p.students s GROUP BY p")
    List<Object[]> findProgramsWithStudentCount();
    
    // Find programs with teachers count
    @Query("SELECT p, COUNT(t) as teacherCount FROM Program p LEFT JOIN p.teachers t GROUP BY p")
    List<Object[]> findProgramsWithTeacherCount();
    
    // Search programs by name or code
    @Query("SELECT p FROM Program p WHERE p.name LIKE %:searchTerm% OR p.code LIKE %:searchTerm%")
    List<Program> searchPrograms(@Param("searchTerm") String searchTerm);
}