package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_responses")
public class EvaluationResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= RELATIONS =================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private StudentEvaluation evaluation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parameter_id", nullable = false)
    private EvaluationParameter parameter;

    // ================= CORE VALUE =================
    // 🔥 SINGLE SOURCE OF TRUTH
    @Column(name = "response_value", nullable = false, length = 255)
    private String responseValue;

    // ================= META =================
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ================= GETTERS & SETTERS =================

    public Long getId() {
        return id;
    }

    public StudentEvaluation getEvaluation() {
        return evaluation;
    }

    public void setEvaluation(StudentEvaluation evaluation) {
        this.evaluation = evaluation;
    }

    public EvaluationParameter getParameter() {
        return parameter;
    }

    public void setParameter(EvaluationParameter parameter) {
        this.parameter = parameter;
    }

    // 🔥 ALWAYS SAFE
    public String getResponseValue() {
        return responseValue;
    }

    // 🔥 ALWAYS SAFE (NO CASTING EVER)
    public void setResponseValue(Object value) {
        this.responseValue = String.valueOf(value);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
