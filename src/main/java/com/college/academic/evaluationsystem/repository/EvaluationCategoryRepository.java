// EvaluationCategoryRepository.java
package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.EvaluationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluationCategoryRepository extends JpaRepository<EvaluationCategory, Long> {
    
    List<EvaluationCategory> findByIsActiveTrueOrderBySortOrderAsc();
    
    @Query("SELECT c FROM EvaluationCategory c WHERE c.isActive = true ORDER BY c.sortOrder")
    List<EvaluationCategory> findActiveCategoriesWithParameters();

    public List<EvaluationCategory> findAllByOrderBySortOrderAsc();
}