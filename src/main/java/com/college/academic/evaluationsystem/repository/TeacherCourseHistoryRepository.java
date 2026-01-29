package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.TeacherCourseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TeacherCourseHistoryRepository 
        extends JpaRepository<TeacherCourseHistory, Long> {
List<TeacherCourseHistory> findTop5ByOrderByAssignedAtDesc();

    @Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.teacher.id = :teacherId
""")
List<TeacherCourseHistory> findByTeacherDbId(Long teacherId);

    
    // ADD THESE METHODS

@Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.removedAt IS NULL
""")
List<TeacherCourseHistory> findAllActive();

@Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.removedAt IS NOT NULL
""")
List<TeacherCourseHistory> findAllPrevious();


@Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.teacher.id = :teacherId
AND h.removedAt IS NULL
""")
List<TeacherCourseHistory> findActiveCourses(Long teacherId);

@Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.teacher.id = :teacherId
AND h.removedAt IS NOT NULL
""")
List<TeacherCourseHistory> findPreviousCourses(Long teacherId);
@Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.teacher.id = :teacherId
AND h.course.id = :courseId
AND h.removedAt IS NULL
ORDER BY h.assignedAt DESC
""")
List<TeacherCourseHistory> findLatestActiveAssignmentRaw(
    Long teacherId,
    Long courseId
);
default TeacherCourseHistory findLatestActiveAssignment(
    Long teacherId,
    Long courseId
) {
    List<TeacherCourseHistory> list =
        findLatestActiveAssignmentRaw(teacherId, courseId);

    return list.isEmpty() ? null : list.get(0);
}

@Query("""
SELECT h FROM TeacherCourseHistory h
WHERE h.teacher.id = :teacherId
AND h.course.id = :courseId
AND (
  (:mode = 'current' AND h.removedAt IS NULL)
  OR
  (:mode = 'previous' AND h.removedAt IS NOT NULL)
)
ORDER BY h.assignedAt DESC
""")
Optional<TeacherCourseHistory> findActiveOrPreviousAssignment(
    @Param("teacherId") Long teacherId,
    @Param("courseId") Long courseId,
    @Param("mode") String mode
);
@Query("""
SELECT h FROM TeacherCourseHistory h
JOIN Student s 
  ON s.semester.id = h.course.semester.id
WHERE s.id = :studentId
AND h.removedAt IS NULL
""")
List<TeacherCourseHistory> findActiveCoursesByStudent(
    @Param("studentId") Long studentId
);

}