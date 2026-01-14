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
    
    // Basic queries - these should work
    List<Semester> findByProgramId(Long programId);
    List<Semester> findByIsActive(boolean isActive);
    List<Semester> findByProgramIdAndIsActive(Long programId, boolean isActive);
    Optional<Semester> findByProgramIdAndName(Long programId, String name);
    
    // Simple fetch with program
    @Query("SELECT s FROM Semester s JOIN FETCH s.program WHERE s.program.id = :programId")
    List<Semester> findSemestersWithProgram(@Param("programId") Long programId);
    
    // Find semester by ID with relations
    @Query("SELECT s FROM Semester s LEFT JOIN FETCH s.program LEFT JOIN FETCH s.courses WHERE s.id = :id")
    Optional<Semester> findByIdWithRelations(@Param("id") Long id);
    
    // Stats query (FIXED VERSION)
    @Query("SELECT s.id, s.name, p.name, " +
           "COUNT(DISTINCT c.id), " +
           "COUNT(DISTINCT stu.id), " +
           "s.isActive " +
           "FROM Semester s " +
           "LEFT JOIN s.program p " +
           "LEFT JOIN s.courses c " +
           "LEFT JOIN s.students stu " +
           "WHERE stu.status = 'Active' AND stu.hide = '0' " +
           "AND s.program.id = :programId " +
           "GROUP BY s.id, s.name, p.name, s.isActive")
    List<Object[]> findSemesterStatsByProgram(@Param("programId") Long programId);
    
    // OR if you want a simpler version without student filter:
 @Query("SELECT s.id, s.name, p.name, " +
       "COUNT(DISTINCT c.id), " +
       "COUNT(DISTINCT CASE WHEN stu.status = 'Active' AND stu.hide = '0' THEN stu.id END), " +
       "s.isActive " +
       "FROM Semester s " +
       "LEFT JOIN s.program p " +
       "LEFT JOIN s.courses c " +
       "LEFT JOIN s.students stu ON stu.semester.id = s.id " +
       "WHERE s.program.id = :programId " +
       "GROUP BY s.id, s.name, p.name, s.isActive")
List<Object[]> findBasicSemesterStats(@Param("programId") Long programId);
}