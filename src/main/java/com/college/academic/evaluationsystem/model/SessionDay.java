package com.college.academic.evaluationsystem.model;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "session_day")
public class SessionDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("day_number")  // This ensures it returns as day_number in JSON
    private int dayNumber;  
    private String topic;

    @Column(length = 2000)
    private String description;
    private String method; 

    @ManyToOne
    @JoinColumn(name = "session_plan_id")
    @JsonBackReference
    private SessionPlan sessionPlan;

    // ---------- GETTERS & SETTERS ----------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getDayNumber() {
        return dayNumber;
    }

    public void setDayNumber(int dayNumber) {
        this.dayNumber = dayNumber;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public SessionPlan getSessionPlan() {
        return sessionPlan;
    }

    public void setSessionPlan(SessionPlan sessionPlan) {
        this.sessionPlan = sessionPlan;
    }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method;
}
}