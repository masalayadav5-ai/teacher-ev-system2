// EvaluationParameterRepository.java
package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.EvaluationParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluationParameterRepository extends JpaRepository<EvaluationParameter, Long> {
    
    List<EvaluationParameter> findByCategoryIdAndIsActiveTrueOrderBySortOrderAsc(Long categoryId);
    
    List<EvaluationParameter> findByIsActiveTrueOrderByCategory_SortOrderAscSortOrderAsc();
    
    @Query("SELECT p FROM EvaluationParameter p WHERE p.isActive = true AND p.category.isActive = true ORDER BY p.category.sortOrder, p.sortOrder")
    List<EvaluationParameter> findAllActiveParameters();
}