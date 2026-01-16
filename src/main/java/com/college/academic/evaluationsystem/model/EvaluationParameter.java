package com.college.academic.evaluationsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "evaluation_parameters")
public class EvaluationParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔥 IMPORTANT: break circular reference safely
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties({"parameters"})
    private EvaluationCategory category;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "parameter_type", nullable = false, length = 30)
    private String parameterType;

    @Column(columnDefinition = "TEXT")
    private String options; // JSON string for multiple choice / select

    @Column(name = "scale_min")
    private Integer scaleMin = 1;

    @Column(name = "scale_max")
    private Integer scaleMax = 5;

    @Column(name = "scale_labels", columnDefinition = "TEXT")
    private String scaleLabels; // JSON string

    @Column(name = "is_required")
    private Boolean isRequired = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // 🔥 IMPORTANT: prevent lazy JSON issues
    @OneToMany(mappedBy = "parameter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<EvaluationResponse> responses;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /* ================= GETTERS & SETTERS ================= */

    public Long getId() {
        return id;
    }

    public EvaluationCategory getCategory() {
        return category;
    }

    public void setCategory(EvaluationCategory category) {
        this.category = category;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    // 🔥 SAFE setter (NO more 500 error)
    public String getParameterType() {
        return parameterType;
    }

    public void setParameterType(String parameterType) {
        if (parameterType == null || parameterType.isBlank()) {
            throw new IllegalArgumentException("Parameter type is required");
        }

        if (!parameterType.matches(
                "rating|multiple_choice|text_area|select|overall_rating|grade_prediction")) {
            throw new IllegalArgumentException("Invalid parameter type: " + parameterType);
        }

        this.parameterType = parameterType;
    }

    public String getOptions() {
        return options;
    }

    public void setOptions(String options) {
        this.options = options;
    }

    public Integer getScaleMin() {
        return scaleMin;
    }

    public void setScaleMin(Integer scaleMin) {
        this.scaleMin = scaleMin;
    }

    public Integer getScaleMax() {
        return scaleMax;
    }

    public void setScaleMax(Integer scaleMax) {
        this.scaleMax = scaleMax;
    }

    public String getScaleLabels() {
        return scaleLabels;
    }

    public void setScaleLabels(String scaleLabels) {
        this.scaleLabels = scaleLabels;
    }

    public Boolean getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(Boolean isRequired) {
        this.isRequired = isRequired;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<EvaluationResponse> getResponses() {
        return responses;
    }

    public void setResponses(List<EvaluationResponse> responses) {
        this.responses = responses;
    }

    /* ================= HELPER METHODS ================= */

    public boolean isRatingType() {
        return "rating".equals(parameterType) || "overall_rating".equals(parameterType);
    }

    public boolean isMultipleChoiceType() {
        return "multiple_choice".equals(parameterType);
    }

    public boolean isTextAreaType() {
        return "text_area".equals(parameterType);
    }

    public boolean isSelectType() {
        return "select".equals(parameterType) || "grade_prediction".equals(parameterType);
    }
}
