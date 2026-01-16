// EvaluationResponseRepository.java
package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.EvaluationResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluationResponseRepository extends JpaRepository<EvaluationResponse, Long> {
    
    List<EvaluationResponse> findByEvaluationId(Long evaluationId);
    
    List<EvaluationResponse> findByParameterId(Long parameterId);
    
    boolean existsByEvaluationIdAndParameterId(Long evaluationId, Long parameterId);
}