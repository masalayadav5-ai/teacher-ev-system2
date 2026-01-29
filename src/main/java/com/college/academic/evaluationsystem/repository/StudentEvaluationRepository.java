// StudentEvaluationRepository.java
package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.controller.StudentProfileAcademicController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.query.Param;

@Repository
public interface StudentEvaluationRepository extends JpaRepository<StudentEvaluation, Long> {
    
    Optional<StudentEvaluation> findByTeacherIdAndStudentIdAndCourseId(Long teacherId, Long studentId, Long courseId);
    Optional<StudentEvaluation>
    findTopByTeacherIdAndStudentIdAndCourseIdOrderBySubmittedAtDesc(
        Long teacherId,
        Long studentId,
        Long courseId
    );
    List<StudentEvaluation> findByStudentId(Long studentId);
    
    List<StudentEvaluation> findByTeacherId(Long teacherId);
    
    List<StudentEvaluation> findByCourseId(Long courseId);
    
    @Query("SELECT e FROM StudentEvaluation e WHERE e.studentId = ?1 AND e.isSubmitted = false")
    List<StudentEvaluation> findPendingEvaluationsByStudentId(Long studentId);
    

List<StudentEvaluation> findByStudentIdAndIsSubmittedTrue(Long studentId);

List<StudentEvaluation> findByStudentIdAndWeekStart(Long studentId, LocalDate weekStart);
@Query("""
SELECT DISTINCT e.weekStart
FROM StudentEvaluation e
WHERE e.teacherId = :teacherId
AND e.courseId = :courseId
AND e.weekStart >= DATE(:assignedAt)
AND (:removedAt IS NULL OR e.weekStart <= DATE(:removedAt))
AND e.isSubmitted = true
ORDER BY e.weekStart DESC
""")
List<LocalDate> findDistinctWeeksForTeacherCourseWindowed(
    Long teacherId,
    Long courseId,
    LocalDateTime assignedAt,
    LocalDateTime removedAt
);



@Query("""
SELECT e FROM StudentEvaluation e
WHERE e.teacherId = :teacherId
AND e.courseId = :courseId
AND e.weekStart = :weekStart
AND e.isSubmitted = true
""")
List<StudentEvaluation> findByTeacherCourseWeek(
        Long teacherId, Long courseId, LocalDate weekStart
);
boolean existsByTeacherIdAndStudentIdAndCourseIdAndWeekStart(
    Long teacherId,
    Long studentId,
    Long courseId,
    LocalDate weekStart
);
@Query("""
SELECT se FROM StudentEvaluation se
WHERE se.teacherId = :teacherId
  AND se.courseId = :courseId
  AND se.weekStart BETWEEN :weekStart AND :weekEnd
  AND se.submittedAt >= :assignedAt
  AND (:removedAt IS NULL OR se.submittedAt <= :removedAt)
  AND se.isSubmitted = true
""")
List<StudentEvaluation> findForAssignmentWindow(
    @Param("teacherId") Long teacherId,
    @Param("courseId") Long courseId,
    @Param("weekStart") LocalDate weekStart,
    @Param("weekEnd") LocalDate weekEnd,
    @Param("assignedAt") LocalDateTime assignedAt,
    @Param("removedAt") LocalDateTime removedAt
);

@Query("""
SELECT se.teacherId,
       AVG(se.overallRating)
FROM StudentEvaluation se
WHERE se.isSubmitted = true
  AND se.overallRating IS NOT NULL
GROUP BY se.teacherId
ORDER BY AVG(se.overallRating) DESC
""")
List<Object[]> getTeacherLeaderboard();

}