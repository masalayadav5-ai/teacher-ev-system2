// StudentEvaluationRepository.java
package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

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
    
    @Query("SELECT COUNT(e) > 0 FROM StudentEvaluation e WHERE e.teacherId = ?1 AND e.studentId = ?2 AND e.courseId = ?3")
    boolean existsByTeacherAndStudentAndCourse(Long teacherId, Long studentId, Long courseId);
}