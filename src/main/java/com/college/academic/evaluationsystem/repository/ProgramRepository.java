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
  boolean existsByNameIgnoreCase(String name);

boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

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
@Query("""
SELECT 
  p.id,
  p.code,
  p.name,
  p.description,
  COUNT(DISTINCT s.id),
  COUNT(DISTINCT t.id),
  COUNT(DISTINCT t2.id),
  COUNT(DISTINCT sem.id),
  p.isActive
FROM Program p
LEFT JOIN p.students s ON s.hide = '0' AND s.status = 'Active'
LEFT JOIN p.teachers t ON t.hide = '0'
LEFT JOIN p.teachers t2 ON t2.hide = '0' AND t2.status = 'Active'
LEFT JOIN p.semesters sem ON sem.isActive = true
GROUP BY p.id, p.code, p.name, p.description, p.isActive
""")
List<Object[]> fetchProgramOverview();

@Query("SELECT p FROM Program p " +
       "LEFT JOIN FETCH p.semesters s " +
       "LEFT JOIN FETCH s.courses c " +
       "LEFT JOIN FETCH c.teachers t " +
       "WHERE p.isActive = true " +
       "ORDER BY p.id, s.id, c.id")
List<Program> findAllWithStructure();
}