package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.SessionDay;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SessionDayRepository extends JpaRepository<SessionDay, Long> {
    @Query("""
SELECT d FROM SessionDay d
WHERE d.completed = true
ORDER BY d.completedDate DESC
""")
List<SessionDay> findRecentlyCompleted();
@Query("""
SELECT d.sessionPlan.course.id, 
       COUNT(d), 
       SUM(CASE WHEN d.completed = true THEN 1 ELSE 0 END)
FROM SessionDay d
GROUP BY d.sessionPlan.course.id
""")
List<Object[]> getCourseProgressRaw();

}