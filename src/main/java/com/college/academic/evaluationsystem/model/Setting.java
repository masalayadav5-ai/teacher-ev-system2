package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "system_settings")
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "institution_name", nullable = false)
    private String institutionName;

    @Column(name = "established_year")
    private Integer establishedYear;
 

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluation_frequency", nullable = false)
    private EvaluationFrequency evaluationFrequency;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* ---------------- LIFECYCLE ---------------- */

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /* ---------------- GETTERS & SETTERS ---------------- */

    public Long getId() {
        return id;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public Integer getEstablishedYear() {
        return establishedYear;
    }

    public void setEstablishedYear(Integer establishedYear) {
        this.establishedYear = establishedYear;
    }
 

    public EvaluationFrequency getEvaluationFrequency() {
        return evaluationFrequency;
    }

    public void setEvaluationFrequency(EvaluationFrequency evaluationFrequency) {
        this.evaluationFrequency = evaluationFrequency;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}