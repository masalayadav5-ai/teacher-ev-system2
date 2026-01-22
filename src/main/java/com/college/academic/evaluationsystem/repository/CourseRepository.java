package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    // Find course by code
    Optional<Course> findByCode(String code);
    
    // Find courses by semester
    List<Course> findBySemesterId(Long semesterId);
    
    // Find active courses by semester
    List<Course> findBySemesterIdAndIsActive(Long semesterId, boolean isActive);
    
    // Find courses by teacher (using the teacher_course relationship)
    // Update the existing findByTeacherId method in CourseRepository.java
@Query("SELECT DISTINCT c FROM Course c " +
       "LEFT JOIN FETCH c.semester s " +
       "LEFT JOIN FETCH s.program p " +
       "JOIN c.teachers t " +
       "WHERE t.id = :teacherId")
List<Course> findByTeacherId(@Param("teacherId") Long teacherId);
    
    // Find active courses in a semester
    @Query("SELECT c FROM Course c WHERE c.semester.id = :semesterId AND c.isActive = true ORDER BY c.code")
    List<Course> findActiveCoursesBySemester(@Param("semesterId") Long semesterId);
    
    // Find courses by program (through semester)
    @Query("SELECT c FROM Course c JOIN c.semester s WHERE s.program.id = :programId")
    List<Course> findByProgramId(@Param("programId") Long programId);
    
    // Find courses with teachers count
    @Query("SELECT c, COUNT(t) as teacherCount FROM Course c LEFT JOIN c.teachers t WHERE c.semester.id = :semesterId GROUP BY c")
    List<Object[]> findCoursesWithTeacherCount(@Param("semesterId") Long semesterId);
    
    // Search courses by code or name
    @Query("SELECT c FROM Course c WHERE c.code LIKE %:searchTerm% OR c.name LIKE %:searchTerm%")
    List<Course> searchCourses(@Param("searchTerm") String searchTerm);
    
    // Find courses not assigned to a specific teacher
    @Query("SELECT c FROM Course c WHERE c.id NOT IN (SELECT c2.id FROM Course c2 JOIN c2.teachers t WHERE t.id = :teacherId) AND c.semester.id = :semesterId")
    List<Course> findCoursesNotAssignedToTeacher(@Param("teacherId") Long teacherId, @Param("semesterId") Long semesterId);
    @Query("""
    SELECT c FROM Course c
    WHERE c.semester.id = :semesterId
      AND c.isActive = true
      AND c.id NOT IN (
        SELECT c2.id FROM Teacher t
        JOIN t.courses c2
      )
""")
List<Course> findUnassignedBySemesterId(@Param("semesterId") Long semesterId);



@Query("""
   SELECT c, t.fullName FROM Teacher t
   JOIN t.courses c
   WHERE c.semester.id = :semesterId
     AND c.isActive = true
""")
List<Object[]> findAssignedWithTeacherBySemester(@Param("semesterId") Long semesterId);


}