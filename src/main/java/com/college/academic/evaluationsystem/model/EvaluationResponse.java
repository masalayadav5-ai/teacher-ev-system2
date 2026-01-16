package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_responses")
public class EvaluationResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private StudentEvaluation evaluation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parameter_id", nullable = false)
    private EvaluationParameter parameter;

    @Column(name = "rating_value")
    private Integer ratingValue;

    @Column(name = "text_response", columnDefinition = "TEXT")
    private String textResponse;

    @Column(name = "selected_option", length = 100)
    private String selectedOption;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    
    public StudentEvaluation getEvaluation() { return evaluation; }
    public void setEvaluation(StudentEvaluation evaluation) { this.evaluation = evaluation; }
    
    public EvaluationParameter getParameter() { return parameter; }
    public void setParameter(EvaluationParameter parameter) { this.parameter = parameter; }
    
    public Integer getRatingValue() { return ratingValue; }
    public void setRatingValue(Integer ratingValue) { 
        if (parameter != null && parameter.isRatingType()) {
            this.ratingValue = ratingValue;
        } else {
            throw new IllegalStateException("Cannot set rating value for non-rating parameter");
        }
    }
    
    public String getTextResponse() { return textResponse; }
    public void setTextResponse(String textResponse) { 
        if (parameter != null && parameter.isTextAreaType()) {
            this.textResponse = textResponse;
        } else {
            throw new IllegalStateException("Cannot set text response for non-text area parameter");
        }
    }
    
    public String getSelectedOption() { return selectedOption; }
    public void setSelectedOption(String selectedOption) { 
        if (parameter != null && (parameter.isMultipleChoiceType() || parameter.isSelectType())) {
            this.selectedOption = selectedOption;
        } else {
            throw new IllegalStateException("Cannot set selected option for this parameter type");
        }
    }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    // Helper method to get response value based on parameter type
    public Object getResponseValue() {
        if (ratingValue != null) return ratingValue;
        if (textResponse != null) return textResponse;
        if (selectedOption != null) return selectedOption;
        return null;
    }
    
    public void setResponseValue(Object value) {
        if (parameter == null) {
            throw new IllegalStateException("Parameter must be set before setting response value");
        }
        
        if (parameter.isRatingType()) {
            this.ratingValue = (Integer) value;
        } else if (parameter.isTextAreaType()) {
            this.textResponse = (String) value;
        } else if (parameter.isMultipleChoiceType() || parameter.isSelectType()) {
            this.selectedOption = (String) value;
        }
    }
}