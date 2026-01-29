package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    boolean existsByYearAndTerm(String year, String term);

    boolean existsByYearAndTermAndIdNot(String year, String term, Long id);
}
