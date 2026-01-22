package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.SessionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionPlanRepository extends JpaRepository<SessionPlan, Long> {
    
    // Find session plans by program
    List<SessionPlan> findByProgramId(Long programId);
    
    // Find session plans by semester
    List<SessionPlan> findBySemesterId(Long semesterId);
    
    // Find session plans by course
    List<SessionPlan> findByCourseId(Long courseId);
    
    // Find session plans by teacher
    List<SessionPlan> findByTeacherId(Long teacherId);
    
    // Find session plans by program and semester
    List<SessionPlan> findByProgramIdAndSemesterId(Long programId, Long semesterId);
    
    // Find session plans by program and course
    List<SessionPlan> findByProgramIdAndCourseId(Long programId, Long courseId);
    
    // Find session plans by teacher and course
    List<SessionPlan> findByTeacherIdAndCourseId(Long teacherId, Long courseId);
    
    // Find session plans for a student (based on student's program and semester)
    @Query("SELECT sp FROM SessionPlan sp " +
           "WHERE sp.program.id = :programId " +
           "AND sp.semester.id = :semesterId " +
           "ORDER BY sp.createdDate DESC")
    List<SessionPlan> findForStudent(@Param("programId") Long programId, 
                                     @Param("semesterId") Long semesterId);
    
    // Find session plans created by a teacher in a specific program
    @Query("SELECT sp FROM SessionPlan sp " +
           "WHERE sp.teacher.id = :teacherId " +
           "AND sp.program.id = :programId " +
           "ORDER BY sp.createdDate DESC")
    List<SessionPlan> findByTeacherAndProgram(@Param("teacherId") Long teacherId,
                                              @Param("programId") Long programId);
    
    // Find latest session plans
    @Query("SELECT sp FROM SessionPlan sp ORDER BY sp.createdDate DESC")
    List<SessionPlan> findLatestSessionPlans();
    
    // Find session plans with days eagerly fetched
    @Query("SELECT DISTINCT sp FROM SessionPlan sp LEFT JOIN FETCH sp.days ORDER BY sp.createdDate DESC")
    List<SessionPlan> findAllWithDays();
   boolean existsByProgram_IdAndSemester_IdAndCourse_Id(
    Long programId,
    Long semesterId,
    Long courseId
);

}