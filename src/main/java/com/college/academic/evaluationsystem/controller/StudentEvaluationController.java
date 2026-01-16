package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
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
    public ResponseEntity<List<StudentEvaluation>> getEvaluationsByStudent(@PathVariable Long studentId) {
        List<StudentEvaluation> evaluations = evaluationRepository.findByStudentId(studentId);
        return ResponseEntity.ok(evaluations);
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
    public ResponseEntity<Map<String, Boolean>> checkEvaluationExists(
            @RequestParam Long teacherId,
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        
        boolean exists = evaluationRepository.existsByTeacherAndStudentAndCourse(teacherId, studentId, courseId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
    
    // Create new evaluation
    @PostMapping("/create")
    public ResponseEntity<StudentEvaluation> createEvaluation(
            @RequestParam Long teacherId,
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        
        // Check if already exists
        if (evaluationRepository.existsByTeacherAndStudentAndCourse(teacherId, studentId, courseId)) {
            return ResponseEntity.badRequest().body(null);
        }
        
        StudentEvaluation evaluation = new StudentEvaluation();
        evaluation.setTeacherId(teacherId);
        evaluation.setStudentId(studentId);
        evaluation.setCourseId(courseId);
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