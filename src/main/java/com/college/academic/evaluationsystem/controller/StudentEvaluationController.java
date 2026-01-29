package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.model.TeacherCourseHistory;
import com.college.academic.evaluationsystem.repository.EvaluationResponseRepository;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
import com.college.academic.evaluationsystem.repository.TeacherCourseHistoryRepository;
import jakarta.persistence.EntityManager;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/evaluation")
public class StudentEvaluationController {
  
    @Autowired
    private StudentEvaluationRepository evaluationRepository;
    @Autowired
private TeacherCourseHistoryRepository historyRepository;

    // Get all evaluations
    @GetMapping("/evaluations")
    public ResponseEntity<List<StudentEvaluation>> getAllEvaluations() {
        List<StudentEvaluation> evaluations = evaluationRepository.findAll();
        return ResponseEntity.ok(evaluations);
    }
    
    // Get evaluation by ID
    @GetMapping("/evaluations/{id}")
    public ResponseEntity<StudentEvaluation> getEvaluationById(@PathVariable Long id) {
        Optional<StudentEvaluation> evaluation = evaluationRepository.findById(id);
        return evaluation.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    // Get evaluations by student
  @GetMapping("/student/{studentId}")
public ResponseEntity<List<Map<String, Object>>> getEvaluationsByStudent(
        @PathVariable Long studentId) {

    List<StudentEvaluation> list =
        evaluationRepository.findByStudentId(studentId);

    List<Map<String, Object>> result = new java.util.ArrayList<>();

    for (StudentEvaluation e : list) {

        TeacherCourseHistory h =
            historyRepository.findLatestActiveAssignment(
                e.getTeacherId(), e.getCourseId()
            );

        result.add(Map.of(
            "courseId", e.getCourseId(),
            "courseName", h != null ? h.getCourse().getName() : "Course",
            "overallRating", e.getOverallRating(),
            "isSubmitted", e.getIsSubmitted(),
            "weekStart", e.getWeekStart()
        ));
    }

    return ResponseEntity.ok(result);
}

    
    // Get evaluations by teacher
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<StudentEvaluation>> getEvaluationsByTeacher(@PathVariable Long teacherId) {
        List<StudentEvaluation> evaluations = evaluationRepository.findByTeacherId(teacherId);
        return ResponseEntity.ok(evaluations);
    }
    
    // Get evaluations by course
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<StudentEvaluation>> getEvaluationsByCourse(@PathVariable Long courseId) {
        List<StudentEvaluation> evaluations = evaluationRepository.findByCourseId(courseId);
        return ResponseEntity.ok(evaluations);
    }
    
    // Get pending evaluations for student
    @GetMapping("/student/{studentId}/pending")
    public ResponseEntity<List<StudentEvaluation>> getPendingEvaluations(@PathVariable Long studentId) {
        List<StudentEvaluation> pending = evaluationRepository.findPendingEvaluationsByStudentId(studentId);
        return ResponseEntity.ok(pending);
    }
    
    // Check if evaluation exists
    @GetMapping("/exists")
    public ResponseEntity checkEvaluationExists(
            @RequestParam Long teacherId,
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        // 🔥 WEEK-BASED EXIST CHECK
LocalDate weekStart = LocalDate.now()
    .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));

boolean exists =
    evaluationRepository.existsByTeacherIdAndStudentIdAndCourseIdAndWeekStart(
        teacherId, studentId, courseId, weekStart);

return ResponseEntity.ok(Map.of(
    "exists", exists,
    "weekStart", weekStart
));

    }
    
    // Create new evaluation
    @PostMapping("/create")
    public ResponseEntity<StudentEvaluation> createEvaluation(
            @RequestParam Long teacherId,
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        
     // 🔥 WEEK-BASED CREATE BLOCK
LocalDate weekStart = LocalDate.now()
    .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));

if (evaluationRepository.existsByTeacherIdAndStudentIdAndCourseIdAndWeekStart(
        teacherId, studentId, courseId, weekStart)) {

    return ResponseEntity.badRequest().body(null);
}

StudentEvaluation evaluation = new StudentEvaluation();
evaluation.setTeacherId(teacherId);
evaluation.setStudentId(studentId);
evaluation.setCourseId(courseId);
evaluation.setWeekStart(weekStart);   // 🔥 REQUIRED
evaluation.setIsSubmitted(false);

        
        StudentEvaluation saved = evaluationRepository.save(evaluation);
        return ResponseEntity.ok(saved);
    }
    
    // Submit evaluation (mark as submitted)
    @PutMapping("/evaluations/{id}/submit")
    public ResponseEntity<StudentEvaluation> submitEvaluation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        
        return evaluationRepository.findById(id).map(evaluation -> {
            if (data.containsKey("overallRating")) {
                evaluation.setOverallRating(Double.parseDouble(data.get("overallRating").toString()));
            }
            if (data.containsKey("predictedGrade")) {
                evaluation.setPredictedGrade((String) data.get("predictedGrade"));
            }
            
            evaluation.submitEvaluation();
            StudentEvaluation updated = evaluationRepository.save(evaluation);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Update evaluation
    @PutMapping("/evaluations/{id}")
    public ResponseEntity<StudentEvaluation> updateEvaluation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        
        return evaluationRepository.findById(id).map(evaluation -> {
            if (updates.containsKey("overallRating")) {
                evaluation.setOverallRating(Double.parseDouble(updates.get("overallRating").toString()));
            }
            if (updates.containsKey("predictedGrade")) {
                evaluation.setPredictedGrade((String) updates.get("predictedGrade"));
            }
            if (updates.containsKey("isSubmitted")) {
                boolean isSubmitted = Boolean.parseBoolean(updates.get("isSubmitted").toString());
                evaluation.setIsSubmitted(isSubmitted);
                if (isSubmitted && evaluation.getSubmittedAt() == null) {
                    evaluation.setSubmittedAt(java.time.LocalDateTime.now());
                }
            }
            
            StudentEvaluation updated = evaluationRepository.save(evaluation);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Delete evaluation
    @DeleteMapping("/evaluations/{id}")
    public ResponseEntity<Map<String, String>> deleteEvaluation(@PathVariable Long id) {
        if (evaluationRepository.existsById(id)) {
            evaluationRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Evaluation deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
    
}