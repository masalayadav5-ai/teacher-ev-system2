package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="student_evaluations")


public class StudentEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "evaluation_date")
    private LocalDateTime evaluationDate = LocalDateTime.now();

    // FIX HERE: Remove precision and scale for DECIMAL type
    @Column(name = "overall_rating")
    private Double overallRating; // Changed from Decimal to Double

    @Column(name = "predicted_grade", length = 2)
    private String predictedGrade;

    @Column(name = "is_submitted")
    private Boolean isSubmitted = false;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name="week_start", nullable=false)
private LocalDate weekStart;

    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EvaluationResponse> responses;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters remain the same
    public Long getId() { return id; }
    
    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    
    public LocalDateTime getEvaluationDate() { return evaluationDate; }
    public void setEvaluationDate(LocalDateTime evaluationDate) { this.evaluationDate = evaluationDate; }
    
    public Double getOverallRating() { return overallRating; }
    public void setOverallRating(Double overallRating) { this.overallRating = overallRating; }
    
    public String getPredictedGrade() { return predictedGrade; }
    public void setPredictedGrade(String predictedGrade) { this.predictedGrade = predictedGrade; }
    
    public Boolean getIsSubmitted() { return isSubmitted; }
    public void setIsSubmitted(Boolean isSubmitted) { 
        this.isSubmitted = isSubmitted;
        if (isSubmitted && this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
    }
    
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<EvaluationResponse> getResponses() { return responses; }
    public void setResponses(List<EvaluationResponse> responses) { this.responses = responses; }
    
    public void submitEvaluation() {
        this.isSubmitted = true;
        this.submittedAt = LocalDateTime.now();
    }

    public void setWeekStart(LocalDate weekStart) {
    this.weekStart = weekStart;
}

}