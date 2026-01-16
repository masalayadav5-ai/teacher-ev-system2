// EvaluationResponseRepository.java
package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.EvaluationResponse;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface EvaluationResponseRepository extends JpaRepository<EvaluationResponse, Long> {
    
    List<EvaluationResponse> findByEvaluationId(Long evaluationId);
    
    List<EvaluationResponse> findByParameterId(Long parameterId);
    
    boolean existsByEvaluationIdAndParameterId(Long evaluationId, Long parameterId);
@Query("""
SELECT p.questionText,
       AVG(CAST(r.responseValue AS double))
FROM EvaluationResponse r
JOIN r.parameter p
JOIN r.evaluation e
WHERE e.teacherId = :teacherId
AND e.courseId = :courseId
AND e.weekStart = :weekStart
AND p.parameterType IN ('rating', 'overall_rating', 'select', 'multiple_choice')
GROUP BY p.id, p.questionText
ORDER BY p.sortOrder
""")
List<Object[]> parameterAverageForCourseWeek(
        Long teacherId,
        Long courseId,
        LocalDate weekStart
);



}